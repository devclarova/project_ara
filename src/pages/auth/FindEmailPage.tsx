import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { maskEmail } from '../../utils/emailUtils';
import { verifyRecoveryAnswer } from '../../utils/recovery';
import AuthBackground from '../../components/auth/AuthBackground';

type FindMethod = 'email' | 'question' | null;

export default function FindEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [method, setMethod] = useState<FindMethod>(null);
  const [nickname, setNickname] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFindByRecoveryEmail = async () => {
    if (!nickname.trim()) {
      setError(t('find_email.error_nickname_required'));
      return;
    }
    if (!recoveryEmail.trim()) {
      setError(t('find_email.error_recovery_email_required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // DB에서 닉네임과 복구 이메일이 일치하는 프로필 조회
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('user_id, recovery_email')
        .eq('nickname', nickname.trim())
        .eq('recovery_email', recoveryEmail.trim().toLowerCase())
        .maybeSingle();

      if (dbError || !data) {
        setError(t('find_email.error_not_found'));
        return;
      }

      // user_id로 RPC 함수 호출하여 이메일 가져오기
      const { data: userEmail, error: emailError } = await supabase
        .rpc('get_user_email_by_id', { p_user_id: data.user_id });
      
      if (emailError || !userEmail) {
        console.error('Email fetch error:', emailError);
        setError(t('find_email.error_not_found'));
        return;
      }

      setFoundEmail(maskEmail(userEmail));
    } catch (err) {
      console.error('Find email error:', err);
      setError(t('find_email.error_not_found'));
    } finally {
      setLoading(false);
    }
  };

  const handleFindByQuestion = async () => {
    if (!nickname.trim()) {
      setError(t('find_email.error_nickname_required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1단계: 닉네임으로 프로필 조회하여 질문 가져오기
      if (!question) {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('recovery_question, recovery_answer_hash, user_id')
          .eq('nickname', nickname.trim())
          .maybeSingle();

        if (dbError || !data || !data.recovery_question) {
          setError(t('find_email.error_no_recovery'));
          setLoading(false);
          return;
        }

        // 질문 표시
        setQuestion(data.recovery_question);
        setLoading(false);
        return;
      }

      // 2단계: 답변 검증
      if (!answer.trim()) {
        setError(t('find_email.error_answer_required'));
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('recovery_answer_hash, user_id')
        .eq('nickname', nickname.trim())
        .maybeSingle();

      if (dbError || !data || !data.recovery_answer_hash) {
        setError(t('find_email.error_not_found'));
        return;
      }

      // 답변 해시 검증
      const isValid = await verifyRecoveryAnswer(answer, data.recovery_answer_hash);
      
      if (!isValid) {
        setError(t('find_email.error_not_found'));
        return;
      }

      // user_id로 RPC 함수 호출하여 이메일 가져오기
      const { data: userEmail, error: emailError } = await supabase
        .rpc('get_user_email_by_id', { p_user_id: data.user_id });
      
      if (emailError || !userEmail) {
        console.error('Email fetch error:', emailError);
        setError(t('find_email.error_not_found'));
        return;
      }

      setFoundEmail(maskEmail(userEmail));
    } catch (err) {
      console.error('Find email error:', err);
      setError(t('find_email.error_not_found'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'email') {
      handleFindByRecoveryEmail();
    } else if (method === 'question') {
      handleFindByQuestion();
    } else {
      setError(t('find_email.select_method'));
    }
  };

  const resetForm = () => {
    setMethod(null);
    setNickname('');
    setRecoveryEmail('');
    setAnswer('');
    setQuestion('');
    setFoundEmail(null);
    setError('');
  };

  return (
    <AuthBackground>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('find_email.title')}
          </h1>

          {/* 결과 표시 */}
          {foundEmail ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  {t('find_email.result_found')}
                </p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {foundEmail}
                </p>
              </div>
              <button
                onClick={() => navigate('/signin')}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition"
              >
                {t('find_email.back_to_login')}
              </button>
              <button
                onClick={resetForm}
                className="w-full py-3 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition"
              >
                {t('common.search')} {t('common.back')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 방법 선택 */}
              {!method && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t('find_email.method_select')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition"
                  >
                    {t('find_email.method_recovery_email')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('question')}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition"
                  >
                    {t('find_email.method_question')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/signin')}
                    className="w-full py-3 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition"
                  >
                    {t('find_email.back_to_login')}
                  </button>
                </div>
              )}

              {/* 닉네임 입력 (공통) */}
              {method && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t('find_email.nickname_label')}
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder={t('find_email.nickname_placeholder')}
                    className="ara-focus ara-rounded w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* 복구 이메일 방식 */}
              {method === 'email' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t('find_email.recovery_email_label')}
                  </label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={e => setRecoveryEmail(e.target.value)}
                    placeholder={t('find_email.recovery_email_placeholder')}
                    className="ara-focus ara-rounded w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* 복구 질문 방식 */}
              {method === 'question' && question && (
                <>
                  <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/50 rounded-lg p-4">
                    <p className="text-sm text-primary-dark dark:text-primary-light mb-1">
                      {t('find_email.your_question')}
                    </p>
                    <p className="font-semibold text-primary-dark dark:text-primary-light">
                      {t(`recovery.${question}`)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      {t('find_email.answer_label')}
                    </label>
                    <input
                      type="text"
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      placeholder={t('find_email.answer_placeholder')}
                      className="ara-focus ara-rounded w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* 제출 버튼 */}
              {method && (
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                  >
                    {loading ? t('find_email.finding') : t('find_email.find_button')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full py-3 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition"
                  >
                    {t('common.back')}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </AuthBackground>
  );
}
