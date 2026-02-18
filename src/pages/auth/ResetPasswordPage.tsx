import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import AuthBackground from '../../components/auth/AuthBackground';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(t('reset_password.error_email_required'));
      return;
    }

    if (!validateEmail(email.trim())) {
      setError(t('reset_password.error_invalid_email'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

      if (resetError) {
        console.error('Password reset error:', resetError);
        console.log('Reset attempt for email:', email.trim().toLowerCase());
        // 보안상 이메일 존재 여부를 노출하지 않고 항상 성공 메시지 표시
      }

      // 항상 성공 메시지 표시 (보안)
      setSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      // 보안상 항상 성공 메시지 표시
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('reset_password.title')}
          </h1>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  {t('reset_password.success_title')}
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  {t('reset_password.success_message')}
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {t('reset_password.check_inbox')}
                </p>
              </div>
              <button
                onClick={() => navigate('/signin')}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition"
              >
                {t('reset_password.back_to_login')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t('reset_password.email_label')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder={t('reset_password.email_placeholder')}
                  className="ara-focus ara-rounded w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                >
                  {loading ? t('reset_password.sending') : t('reset_password.send_reset_link')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/signin')}
                  className="w-full py-3 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition"
                >
                  {t('reset_password.back_to_login')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthBackground>
  );
}
