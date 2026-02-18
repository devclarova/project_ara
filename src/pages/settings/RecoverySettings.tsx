import Button from '@/components/common/Buttons';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { RECOVERY_QUESTIONS, type RecoveryQuestion } from '@/types/signup';
import { hashRecoveryAnswer } from '@/utils/recovery';
import InputField from '@/components/auth/InputField';
import SelectField from '@/components/auth/SelectField';

const validateEmailField = (email: string, t: any) => {
  const EMAIL_ASCII_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!email.trim()) return null; // Allow empty as it's partial
  if (!EMAIL_ASCII_RE.test(email)) return t('validation.email_invalid');
  return null;
};

interface RecoverySettingsProps {
  onDone?: () => void;
  onClose?: () => void;
}

function RecoverySettings({ onDone, onClose }: RecoverySettingsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [recoveryQuestion, setRecoveryQuestion] = useState<RecoveryQuestion | ''>('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [hasExistingAnswer, setHasExistingAnswer] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'taken' | ''>('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch current recovery info
  useEffect(() => {
    const fetchRecoveryInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setPrimaryEmail(user.email || '');

        const { data, error } = await supabase
          .from('profiles')
          .select('recovery_question, recovery_email, recovery_answer_hash')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setRecoveryQuestion((data.recovery_question as RecoveryQuestion) || '');
          setRecoveryEmail(data.recovery_email || '');
          setInitialEmail(data.recovery_email || '');
          setHasExistingAnswer(!!data.recovery_answer_hash);
          if (data.recovery_email) setEmailCheckResult('available');
        }
      } catch (error) {
        console.error('Failed to fetch recovery info:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchRecoveryInfo();
  }, []);

  const isValidQuestionSet = recoveryQuestion && recoveryAnswer.trim().length >= 2;
  const isValidEmailSet = recoveryEmail.trim().length > 0 && 
                         emailCheckResult === 'available' && 
                         recoveryEmail !== primaryEmail;
  const isEmailModified = recoveryEmail !== initialEmail;

  const handleEmailCheck = async () => {
    const msg = validateEmailField(recoveryEmail, t);
    if (msg) {
      setErr(msg);
      return;
    }
    if (recoveryEmail === primaryEmail) {
      setErr(t('validation.recovery_email_same_as_primary', '현재 계정 이메일과 동일합니다.'));
      return;
    }

    setEmailChecking(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc('email_exists', { _email: recoveryEmail.trim() });
      if (error) throw error;
      setEmailCheckResult(data === true ? 'taken' : 'available');
      if (data === true) {
        setErr(t('signup.error_email_taken'));
      }
    } catch (err: any) {
      console.error('Email check error:', err);
      setErr(t('signup.error_email_check_retry'));
    } finally {
      setEmailChecking(false);
    }
  };

  const canSubmit = isValidQuestionSet || (isValidEmailSet && isEmailModified);

  const submit = async () => {
    if (!canSubmit) {
      if (recoveryAnswer.trim().length > 0 && recoveryAnswer.trim().length < 2) {
        setErr(t('validation.recovery_answer_too_short'));
        return;
      }
      setErr(t('settings.no_changes_or_invalid'));
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErr(t('auth.session_expired'));
        return;
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (isValidQuestionSet) {
        updateData.recovery_question = recoveryQuestion;
        updateData.recovery_answer_hash = await hashRecoveryAnswer(recoveryAnswer);
      }

      if (isValidEmailSet && isEmailModified) {
        updateData.recovery_email = recoveryEmail.trim();
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success(t('settings.saved', '설정이 저장되었습니다.'));
      onDone?.();
      onClose?.();
    } catch (error: any) {
      console.error('Recovery update error:', error);
      setErr(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };



  const questionOptions = useMemo(() => 
    RECOVERY_QUESTIONS.map(q => ({
      value: q,
      label: t(q)
    })), [t]);

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-secondary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 px-4 md:px-6 py-4 md:py-5 space-y-6 bg-white dark:bg-secondary">
        <div className="space-y-4">
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            {t('recovery.section_description')}
          </p>
          
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100/50 dark:border-teal-800/20">
            <i className="ri-information-fill text-teal-600 dark:text-teal-400 text-lg leading-none mt-0.5" />
            <p className="text-xs md:text-sm text-teal-800 dark:text-teal-300 font-medium leading-relaxed">
              {t('recovery.partial_setup_guide')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 보안 질문 설정 */}
          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4 bg-gray-50/30 dark:bg-gray-900/10">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <i className="ri-shield-user-line text-primary" />
              {t('recovery.set_question_title', '보안 질문 설정')}
            </h4>
            
            <div className="space-y-6">
              <SelectField
                id="recovery-question"
                label={t('recovery.question_label')}
                value={recoveryQuestion}
                onChange={(v) => setRecoveryQuestion(v as RecoveryQuestion)}
                options={questionOptions}
                placeholder={t('recovery.question_placeholder')}
                disabled={loading}
              />

              <InputField
                id="recovery-answer"
                label={t('recovery.answer_label')}
                type="text"
                value={recoveryAnswer}
                onChange={setRecoveryAnswer}
                inputProps={{
                  placeholder: hasExistingAnswer ? t('recovery.answer_placeholder_already_set') : t('recovery.answer_placeholder')
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* 복구 이메일 설정 */}
          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4 bg-gray-50/30 dark:bg-gray-900/10">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <i className="ri-mail-line text-primary" />
              {t('recovery.set_email_title', '복구 이메일 설정')}
            </h4>

            <div className="space-y-2">
              <InputField
                id="recovery-email"
                label={t('recovery.temp_email_label')}
                type="email"
                value={recoveryEmail}
                onChange={(v) => {
                  setRecoveryEmail(v);
                  setEmailCheckResult('');
                  setErr(null);
                }}
                isChecking={emailChecking}
                checkResult={emailCheckResult}
                onCheck={handleEmailCheck}
                inputProps={{
                  placeholder: t('recovery.temp_email_placeholder')
                }}
                disabled={loading}
              />
              <p className="px-1 text-[11px] text-gray-500 dark:text-gray-400">
                {t('recovery.temp_email_description')}
              </p>
            </div>
          </div>
        </div>

        {err && <p className="text-xs md:text-sm text-red-500 pt-1 font-medium">{err}</p>}
      </div>

      {/* 푸터 */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary px-4 md:px-6 py-3.5 md:py-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button type="button" variant="primary" size="md" onClick={submit} disabled={!canSubmit || loading}>
          {loading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}

export default RecoverySettings;
