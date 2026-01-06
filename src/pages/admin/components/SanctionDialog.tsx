import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { addYears, addDays } from 'date-fns';
import { Ban, X, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SanctionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string; // auth.user.id
    profile_id?: string; // profiles.id (Required for foreign keys)
    nickname: string;
  } | null;
  onSuccess: (bannedUntil: string | null) => void;
  mode?: 'ban' | 'unban';
  reportId?: string;
}

const SanctionDialog: React.FC<SanctionDialogProps> = ({ 
  isOpen, 
  onClose, 
  targetUser, 
  onSuccess,
  mode = 'ban',
  reportId
}) => {
  const [banDuration, setBanDuration] = useState<number | 'permanent' | 'custom'>(1);
  const [customDays, setCustomDays] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBanDuration(1);
      setCustomDays('');
      setReason('');
    }
  }, [isOpen]);

  const executeAction = async () => {
    if (!targetUser) return;
    
    if (mode === 'ban' && !reason.trim()) {
      toast.error('제한 사유를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      let until: string | null = null;
      let durationDays: number | null = null;
      
      if (mode === 'ban') {
        if (banDuration === 'permanent') {
          until = addYears(new Date(), 100).toISOString();
          durationDays = 36500;
        } else if (banDuration === 'custom') {
          const days = parseInt(customDays);
          if (isNaN(days) || days <= 0) {
            toast.error('유효한 이용 제한 기간을 입력해주세요.');
            setIsProcessing(false);
            return;
          }
          until = addDays(new Date(), days).toISOString();
          durationDays = days;
        } else {
          until = addDays(new Date(), banDuration as number).toISOString();
          durationDays = banDuration as number;
        }
      } else {
        until = null;
        durationDays = 0;
      }

      // Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banned_until: until })
        .eq('user_id', targetUser.id);

      if (updateError) throw updateError;

      // Log to Sanction History
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id) {
        const { data: adminP } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (adminP) {
          const { error: historyError } = await supabase.from('sanction_history').insert({
            target_user_id: targetUser.profile_id || targetUser.id, // Prefer profile_id (Profile UUID)
            sanction_type: mode === 'ban' ? (banDuration === 'permanent' ? 'permanent_ban' : 'ban') : 'unban',
            duration_days: durationDays,
            reason: reason.trim() || (mode === 'unban' ? '관리자에 의한 이용제한 해제' : '사유 미입력'),
            admin_id: adminP.id,
            report_id: reportId
          });
          
          if (historyError) {
            console.error('History Log Error:', historyError);
            if (historyError.code === '23505' || historyError.code === '23503') {
              throw new Error(`데이터 충돌 또는 참조 오류가 발생했습니다 (${historyError.code}). DB 마이그레이션을 실행했는지 확인해주세요.`);
            } else if (historyError.code === '23514') {
              throw new Error('허용되지 않는 제재 유형입니다 (\'unban\' 등). DB 제약 조건 업데이트가 필요합니다.');
            }
            throw historyError;
          }

          // 4. Insert Notification for Target User
          await supabase.from('notifications').insert({
            type: 'system',
            content: mode === 'ban' 
              ? `운용 정책 위반으로 인해 이용이 제한되었습니다. (사유: ${reason.trim()}, 기간: ${banDuration === 'permanent' ? '영구' : (durationDays === 1 ? '1일' : durationDays + '일')})`
              : '이용 제한이 해제되었습니다. 다시 서비스를 정상적으로 이용하실 수 있습니다.',
            receiver_id: targetUser.profile_id || targetUser.id,
            is_read: false
          });
        }
      }

      const successMsg = mode === 'ban' 
        ? `${targetUser.nickname}님을 ${banDuration === 'permanent' ? '영구' : durationDays + '일'}간 정지했습니다.`
        : `${targetUser.nickname}님의 이용제한을 해제했습니다.`;
      
      toast.success(successMsg);
      onSuccess(until);
      onClose();
    } catch (err: any) {
      console.error('Sanction Execution Error:', err);
      toast.error('처리 실패: ' + (err.message || '알 수 없는 오류가 발생했습니다.'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            {mode === 'ban' ? (
              <><Ban size={20} className="text-red-500" /> 이용 제한 설정</>
            ) : (
              <><Info size={20} className="text-emerald-500" /> 이용 제한 해제</>
            )}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              대상 사용자: <span className="font-bold text-zinc-900 dark:text-zinc-100">{targetUser?.nickname}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {mode === 'ban' 
                ? '기간 동안 해당 사용자는 글쓰기, 댓글, 채팅 등이 제한됩니다.' 
                : '이 사용자의 모든 이용 제한을 즉시 해제합니다.'}
            </p>
          </div>
          
          {mode === 'ban' && (
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 7, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setBanDuration(days)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    banDuration === days
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/50'
                  }`}
                >
                  {days}일
                </button>
              ))}
              <button
                onClick={() => setBanDuration('custom')}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  banDuration === 'custom'
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/50'
                }`}
              >
                직접 입력
              </button>
              <button
                onClick={() => setBanDuration('permanent')}
                className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                  banDuration === 'permanent'
                    ? 'bg-red-500 text-white border-red-500 shadow-lg'
                    : 'border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-500 hover:text-white'
                }`}
              >
                영구 정지
              </button>
            </div>
          )}

          <AnimatePresence>
            {mode === 'ban' && banDuration === 'custom' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <input 
                  type="number" 
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="제한 기간 입력 (일)"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  min="1"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
              제한 사유 (필수)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === 'ban' ? "사유를 상세히 입력해 주세요..." : "해제 사유를 입력해 주세요..."}
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-24"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            취소
          </button>
          <button 
            onClick={executeAction}
            disabled={isProcessing || (mode === 'ban' && !reason.trim())}
            className={`px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
              mode === 'ban' ? 'bg-primary text-white hover:bg-primary/90' : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {isProcessing ? '처리 중...' : (mode === 'ban' ? '제한 적용' : '제한 해제')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SanctionDialog;
