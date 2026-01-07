import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/common/Modal';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, User, Shield, Loader2, AlertCircle } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email || !password || !nickname) {
      setError('모든 필드를 입력해 주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('admin_create_user', {
        p_email: email,
        p_password: password,
        p_nickname: nickname,
        p_is_admin: isAdmin
      });

      if (rpcError) throw rpcError;

      toast.success('새 사용자가 성공적으로 생성되었습니다.');
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || '사용자 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setNickname('');
    setIsAdmin(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="새 사용자 추가"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-1">
        <p className="text-sm text-muted-foreground">
          새로운 사용자를 시스템에 직접 등록합니다. 생성 즉시 로그인이 가능합니다.
        </p>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} className="shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">이메일 주소</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@project-ara.com"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:border-primary transition-all outline-none text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:border-primary transition-all outline-none text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">닉네임</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="사용자 닉네임"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-zinc-800 focus:border-primary transition-all outline-none text-sm"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-violet-200 dark:hover:border-violet-900/30 transition-all select-none group">
              <div className="shrink-0 p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 group-hover:text-violet-500 transition-colors">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">관리자 권한 부여</p>
                <p className="text-xs text-zinc-500">이 사용자에게 관리자 페이지 접근 권한을 줍니다.</p>
              </div>
              <div className="relative w-12 h-6">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-violet-600 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <UserPlus size={18} />
                새 사용자 생성하기
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
