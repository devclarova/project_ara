import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Buttons';

const STORAGE_KEY = 'recovery-reminder-v2';

export default function RecoveryReminderModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial safety checks
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    // 2. Exclusion paths: Don't show while in auth flow or on landing page
    const NO_MODAL_PATHS = ['/', '/signin', '/signup', '/auth/callback', '/signup/social', '/find-email', '/reset-password', '/update-password'];
    if (NO_MODAL_PATHS.some(p => pathname === p || (p !== '/' && pathname.startsWith(p)))) {
      setLoading(false);
      return;
    }

    const checkRecoveryInfo = async () => {
      try {
        // 3. Daily frequency check (Per-user)
        const userSpecificKey = `${STORAGE_KEY}-${user.id}`;
        const lastShown = localStorage.getItem(userSpecificKey);
        const today = new Date().toISOString().split('T')[0];
        
        if (lastShown === today) {
          setLoading(false);
          return;
        }

        // 4. Fetch profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('recovery_question, recovery_answer_hash, recovery_email, is_onboarded')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        // 5. Logic: Show if profile exists, onboarded, and BOTH recovery methods are missing
        if (data && data.is_onboarded) {
          const hasQuestion = !!(data.recovery_question && data.recovery_answer_hash);
          const hasEmail = !!data.recovery_email;

          // Only show if BOTH are missing (as requested: "둘 중 하나라도 설정하면 띄우지 말라")
          if (!hasQuestion && !hasEmail) {
            setIsOpen(true);
            // Mark as shown today for this user
            localStorage.setItem(userSpecificKey, today);
          }
        }
      } catch (err) {
        console.warn('Recovery info check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkRecoveryInfo();
  }, [user, authLoading, pathname]);

  const handleGoToSettings = () => {
    setIsOpen(false);
    navigate('/settings', { state: { activeTab: 'privacy', openSetting: 'recovery' } });
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (loading || !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('recovery_reminder.title')}
      className="max-w-[360px] h-auto"
    >
      <div className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <ShieldAlert className="w-8 h-8 text-white -rotate-3" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {t('recovery_reminder.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px] mx-auto">
              {t('recovery_reminder.desc')}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full font-bold py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 border-none shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all"
            onClick={handleGoToSettings}
          >
            {t('recovery_reminder.action')}
          </Button>
          <button
            type="button"
            className="w-full text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1 underline-offset-4 hover:underline"
            onClick={handleClose}
          >
            {t('recovery_reminder.later')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
