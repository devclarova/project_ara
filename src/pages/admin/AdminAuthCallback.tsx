import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// 소셜 로그인 콜백 페이지
// /admin/callback으로 리다이렉트됨
const AdminAuthCallback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndRedirect = async () => {
      try {
        // URL에서 세션 정보 가져오기
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error(t('auth.auth_failed'));
          navigate('/admin/login');
          return;
        }

        // is_admin 확인
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', session.user.id)
          .single();

        if (userError) {
          // profiles row가 없는 경우
          if (userError.code === 'PGRST116') {
            toast.error(t('auth.profile_not_found_contact_admin'));
            await supabase.auth.signOut();
            navigate('/admin/login');
            return;
          }
          throw userError;
        }

        if (!userData?.is_admin) {
          // 관리자가 아닌 경우
          await supabase.auth.signOut();
          toast.error(t('admin.no_permission'));
          navigate('/admin/login');
          return;
        }

        // 관리자 확인 완료
        toast.success(t('admin.login_success'));
        navigate('/admin');
      } catch (error: any) {
        toast.error(t('auth.auth_failed'));
        navigate('/admin/login');
      }
    };

    checkAdminAndRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">인증 처리 중...</p>
      </div>
    </div>
  );
};

export default AdminAuthCallback;
