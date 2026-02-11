import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import AuthBackground from '../../components/auth/AuthBackground';
import { Eye, EyeOff } from 'lucide-react';

export default function UpdatePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 세션 확인 - recovery 토큰이 필요함
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // 세션이 없으면 로그인 페이지로
        navigate('/signin', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!newPassword.trim()) {
      setError(t('update_password.error_required'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('update_password.error_length'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('update_password.error_mismatch'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        setError(t('update_password.error_failed'));
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Password update error:', err);
      setError(t('update_password.error_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('update_password.title')}
          </h1>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  {t('update_password.success_title')}
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {t('update_password.success_message')}
                </p>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/signin');
                }}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition"
              >
                {t('update_password.go_to_login')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t('update_password.new_password_label')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder={t('update_password.new_password_placeholder')}
                    className="ara-focus ara-rounded w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t('update_password.confirm_password_label')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder={t('update_password.confirm_password_placeholder')}
                    className="ara-focus ara-rounded w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {loading ? t('update_password.updating') : t('update_password.update_button')}
              </button>
            </form>
          )}
        </div>
      </div>
    </AuthBackground>
  );
}
