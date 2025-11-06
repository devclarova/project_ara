import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { ActiveSetting } from '@/types/settings';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row } from './Row';
import Modal from '../common/Modal';
import PasswordChange from './PasswordChange';
import SNSConnect from './SNSConnect';
import { getSettingsTitle } from '@/untils/getTitle';

interface PrivacySettingsProps {
  onBackToMenu?: () => void;
}

const CONFIRM_PHRASE = '탈퇴하겠습니다.';

export default function PrivacySettings({ onBackToMenu }: PrivacySettingsProps) {
  const [active, setActive] = useState<ActiveSetting>(null);
  const open = (key: ActiveSetting) => setActive(key);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const close = () => {
    setActive(null);
    setWithdrawError(null);
    setPassword('');
    setConfirmText('');
  };

  const handleWithdraw = async () => {
    if (!user) return;

    // 1) 확인 문구 검사
    if (confirmText.trim() !== CONFIRM_PHRASE) {
      setWithdrawError(`확인 문장 "${CONFIRM_PHRASE}"을 정확히 입력해주세요.`);
      return;
    }

    setWithdrawing(true);
    setWithdrawError(null);

    const provider = (user.app_metadata?.provider as string | undefined) ?? 'email';

    // 2) 이메일 가입자는 비밀번호 재확인
    if (provider === 'email') {
      const email = user.email;
      if (!email) {
        setWithdrawError('이메일 정보를 찾을 수 없습니다. 고객센터로 문의해주세요.');
        setWithdrawing(false);
        return;
      }

      const { error: pwError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (pwError) {
        console.error('withdraw reauth error:', pwError);
        setWithdrawError('비밀번호가 올바르지 않습니다.');
        setWithdrawing(false);
        return;
      }
    }

    // 3) 유저가 작성한 게시물, 댓글 등 삭제
    try {
      // 🔻 여기를 네 실제 테이블명에 맞게 채워야 해
      // 예시:
      // await supabase.from('community_comments').delete().eq('user_id', user.id);
      // await supabase.from('community_posts').delete().eq('user_id', user.id);
      // await supabase.from('tweets').delete().eq('user_id', user.id);
      // ...
    } catch (err) {
      console.error('delete user content error:', err);
      setWithdrawError('작성한 콘텐츠 삭제 중 오류가 발생했습니다.');
      setWithdrawing(false);
      return;
    }

    // 4) profiles.deleted_at 기록 (soft delete)
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (profileErr) {
      console.error('withdraw profile error:', profileErr);
      setWithdrawError('탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setWithdrawing(false);
      return;
    }

    // 5) 로그아웃 + 메인 페이지 이동
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative">
      {/* 메인 목록 */}
      <div className={`${active ? 'pointer-events-none blur-[2px]' : ''}`}>
        {/* 헤더 + 모바일 화살표 */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={onBackToMenu}
            className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="뒤로가기"
          >
            <i className="ri-arrow-left-line text-lg" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">개인정보 설정</h3>
        </div>

        <div className="space-y-2">
          <Row label="비밀번호 변경" onClick={() => open('password')} />
          <Row label="SNS 계정 연결" onClick={() => open('sns')} />
        </div>

        {/* 하단 탈퇴 버튼 */}
        <div className="mt-8 text-right">
          <button
            type="button"
            onClick={() => open('withdraw')}
            className="text-[11px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
          >
            탈퇴하기
          </button>
        </div>

        {/* 하단 여백 */}
        <div className="h-24" />
      </div>

      {/* 모달: active 가 있을 때만 렌더링 */}
      <Modal isOpen={!!active} onClose={close} title={getSettingsTitle(active)}>
        {active === 'password' && <PasswordChange onDone={close} onClose={close} />}

        {active === 'sns' && <SNSConnect onClose={close} />}

        {/* 탈퇴 모달 */}
        {active === 'withdraw' && (
          <div className="space-y-5">
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 px-3 py-2 text-[11px] text-red-700 dark:text-red-300">
              <p className="font-semibold mb-1">탈퇴 전 꼭 확인해주세요.</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>계정 정보와 프로필이 더 이상 서비스에서 사용되지 않습니다.</li>
                <li>작성하신 게시물, 댓글 등 활동 내역도 함께 삭제됩니다.</li>
                <li>삭제된 데이터는 되돌릴 수 없습니다.</li>
                <li>동일 이메일로 재가입 시, 새로운 계정으로 취급될 수 있습니다.</li>
              </ul>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="현재 비밀번호를 입력해주세요."
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                이메일로 가입하신 경우, 본인 확인을 위해 비밀번호를 다시 입력해주세요.
              </p>
            </div>

            {/* 확인 문구 */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                탈퇴 확인 문구
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={`${CONFIRM_PHRASE} 를 정확히 입력해주세요.`}
              />
            </div>

            {withdrawError && <p className="text-xs text-red-500">{withdrawError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={withdrawing}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="px-3 py-1.5 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {withdrawing ? '탈퇴 처리 중…' : '정말 탈퇴하기'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
