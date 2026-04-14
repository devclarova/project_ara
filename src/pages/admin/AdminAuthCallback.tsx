import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/utils/errorMessage';

/**
 * 관리자 인증 콜백 처리기(Admin Auth Callback Handler):
 * - 목적(Why): 최고 관리자 또는 스태프의 OAuth/Magic 링크 로그인을 안전하게 확인하고 대시보드로 인도함
 * - 방법(How): URL 토큰 파싱 후 Supabase 세션을 수립하고 권한 검증 라우트로 리다이렉트를 처리함
 */
const AdminAuthCallback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndRedirect = async () => {
      try {
        // URL 파라미터 기반 인증 세션 로드 — OAuth 콜백 무결성 검증 및 토큰 수신 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error(t('auth.auth_failed'));
          navigate('/admin/login');
          return;
        }

        // 관리자 권한(is_admin) 식별 검증 — RBAC(Role-Based Access Control) 기반 원격 데이터베이스 조회
        const { data: userData, error: userError } = await (supabase.from('profiles') as any)
          .select('is_admin')
          .eq('user_id', session.user.id)
          .single();

        if (userError) {
          // 사용자 프로필 데이터 누락 예외 처리 — 신규 가입 후 프로필 생성 전 또는 비가입자 접근 방지
          if (userError.code === 'PGRST116') {
            toast.error(t('auth.profile_not_found_contact_admin'));
            await supabase.auth.signOut();
            navigate('/admin/login');
            return;
          }
          throw userError;
        }

        if (!userData?.is_admin) {
          // 비인가 사용자 접근 차단 — 일반 사용자 계정의 관리 센터 진입 방지 및 세션 강제 종료
          await supabase.auth.signOut();
          toast.error(t('admin.no_permission'));
          navigate('/admin/login');
          return;
        }

        // 인증 및 권한 검증 성공 — 보안 세션 확정 후 관리 대시보드로 이동 처리
        toast.success(t('admin.login_success'));
        navigate('/admin');
      } catch (error: unknown) {
        console.error('Admin auth callback error:', getErrorMessage(error));
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
