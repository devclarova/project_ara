/**
 * 관리자 로그인 매니저 (Admin Login Manager):
 * - 목적(Why): 최고 권한 계정에 대한 접근 제어 및 시스템 보호 보안 관문을 제공함
 * - 방법(How): Supabase Auth 기반의 JWT 토큰 발급 및 로컬 스토리지 상태 관리를 통해 세션을 검증함
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Lock, Home } from 'lucide-react';

const AdminLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Supabase Auth 서비스 연동 — 이메일/비밀번호 기반 관리자 인증 시도
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 인증 후 인가 처리(Authorization) — 관리자 전용 권한 레벨(is_admin) 교차 검증 수행
      await checkAdminAndNavigate(authData.user.id);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || '인증에 실패했습니다. 계정 정보를 다시 확인해 주세요.');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      setIsLoading(true);

      // AuthCallback에서 정상적으로 리다이렉트 분기를 탈 수 있도록 목적지 플래그 저장
      sessionStorage.setItem('admin_oauth_redirect', '/admin/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // 등록이 보장된 일반 유저 콜백 라우트를 경유하여 배포 환경의 localhost 폴백을 방지함
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Social login error:', error);
      toast.error(error.message || t('auth.auth_failed'));
      setIsLoading(false);
    }
  };

  const checkAdminAndNavigate = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;

      if (!userData?.is_admin) {
        // 비인가 접근 거부 — 보안 정책에 따른 세션 즉시 취소 및 비인가 피드백 제공
        await supabase.auth.signOut();
        toast.error(t('admin.no_permission'));
        setIsLoading(false);
        return;
      }

      // 최종 인가 승인 — 권한 검증 완료 후 관리 시스템 메인 진입
      toast.success(t('admin.login_success'));
      navigate('/admin');
    } catch (error: any) {
      console.error('Admin check error:', error);
      toast.error(t('admin.permission_check_error'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* 배경 오로라 시각 효과 — 관리자 인터페이스의 전문성 및 심미성 확보를 위한 동적 모션 레이어 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointing-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-cyan-200/60 to-blue-300/60 blur-3xl animate-[float1_12s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-emerald-200/60 to-teal-300/60 blur-3xl animate-[float2_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-purple-200/50 to-pink-300/50 blur-3xl animate-[float3_18s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes float1 {
          0% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          25% { 
            transform: translate(40vw, 20vh) scale(1.1);
            opacity: 0.7;
          }
          50% { 
            transform: translate(20vw, 40vh) scale(0.9);
            opacity: 0.8;
          }
          75% { 
            transform: translate(-20vw, 20vh) scale(1.05);
            opacity: 0.6;
          }
          100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
        }
        @keyframes float2 {
          0% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          33% { 
            transform: translate(-30vw, -15vh) scale(1.15);
            opacity: 0.7;
          }
          66% { 
            transform: translate(-50vw, 30vh) scale(0.95);
            opacity: 0.6;
          }
          100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
        }
        @keyframes float3 {
          0% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          40% { 
            transform: translate(30vw, -30vh) scale(1.1);
            opacity: 0.65;
          }
          80% { 
            transform: translate(-10vw, -50vh) scale(0.9);
            opacity: 0.5;
          }
          100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
        }
      `}</style>



      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 dark:border-zinc-800/50 p-8 md:p-12 relative overflow-hidden">


          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600 mb-2">
              ARA 관리 센터
            </h1>
            <p className="text-muted-foreground text-sm break-keep">
              관리 전용 시스템입니다. 관리자 계정으로 로그인해 주세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">이메일 주소</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within/input:text-teal-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-teal-500/10 transition-all duration-300 outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">비밀번호</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within/input:text-teal-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-teal-500/10 transition-all duration-300 outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-muted-foreground cursor-pointer group">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-1 focus:ring-primary/30/30"
                />
                <span className="group-hover:text-muted-foreground transition-colors">
                  로그인 상태 유지
                </span>
              </label>
              <a href="#" className="text-primary hover:text-primary font-medium transition-colors">
                비밀번호를 잊으셨나요?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transform transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                '로그인'
              )}
            </button>

            {/* 소셜 계정 연동 및 레거시 로그인 구분 인터페이스 */}
            <div className="flex items-center py-4">
              <div className="flex-1 border-t border-gray-100 dark:border-zinc-800"></div>
              <span className="px-4 text-[11px] font-black text-muted-foreground/40 uppercase tracking-widest whitespace-nowrap">
                또는
              </span>
              <div className="flex-1 border-t border-gray-100 dark:border-zinc-800"></div>
            </div>

            {/* 소셜 계정 연동(OAuth) 인증 섹션 — Google/Kakao API 브릿지 */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 계속하기
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('kakao')}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] font-medium rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.442 1.443 4.615 3.686 6.044-.159.566-.995 3.571-1.131 4.112-.164.652.238.645.505.469.198-.13 3.177-2.146 4.208-2.847.568.097 1.152.147 1.732.147 5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
                </svg>
                Kakao로 계속하기
              </button>
            </div>
          </form>

          {/* 통합 서비스 복귀 네비게이션 — 샌드박스 환경 이탈 경로 제공 */}
          <div className="mt-10 pt-6 border-t border-gray-100 dark:border-zinc-800/50 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-xs text-muted-foreground hover:text-teal-500 transition-colors inline-flex items-center gap-2 group font-medium"
            >
              <Home size={14} className="group-hover:scale-110 transition-transform" />
              메인 사이트로 돌아가기
            </button>
          </div>
        </div>



        <div className="mt-8 text-center text-[10px] text-muted-foreground opacity-60 tracking-wider">
          <p>© 2025 Project Ara. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
