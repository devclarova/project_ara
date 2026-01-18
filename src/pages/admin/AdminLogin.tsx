import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
      // Supabase 로그인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 로그인 성공 후 is_admin 확인
      await checkAdminAndNavigate(authData.user.id);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || t('auth.auth_failed'));
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/admin/callback`,
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
        // 관리자가 아닌 경우
        await supabase.auth.signOut();
        toast.error(t('admin.no_permission'));
        setIsLoading(false);
        return;
      }

      // 관리자 확인 완료
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
      {/* Background Aurora Effect - Floating Across Screen */}
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
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600 mb-2">
              ARA Admin
            </h1>
            <p className="text-muted-foreground text-sm">
              Welcome back, please login to your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-500 bg-white/50 focus:bg-white focus:ring-2 focus:ring-1 focus:ring-primary/30/20 focus:border-ring transition-all duration-200 outline-none text-muted-foreground placeholder:text-muted-foreground"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-500 bg-white/50 focus:bg-white focus:ring-2 focus:ring-1 focus:ring-primary/30/20 focus:border-ring transition-all duration-200 outline-none text-muted-foreground placeholder:text-muted-foreground"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-muted-foreground cursor-pointer group">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-1 focus:ring-primary/30/30"
                />
                <span className="group-hover:text-muted-foreground transition-colors">
                  Remember me
                </span>
              </label>
              <a href="#" className="text-primary hover:text-primary font-medium transition-colors">
                Forgot password?
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
                'Sign In'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/70 text-muted-foreground">또는</span>
              </div>
            </div>

            {/* Social Login Buttons */}
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
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2025 Project Ara. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
