import Button from '@/components/common/Buttons';
import { useState } from 'react';

function PasswordChange({ onDone, onClose }: { onDone?: () => void; onClose?: () => void }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canSubmit = pw.length >= 8 && pw === pw2;

  const submit = () => {
    if (!canSubmit) {
      setErr('비밀번호를 확인해주세요. (8자 이상 & 동일 입력)');
      return;
    }
    // TODO: API 호출 자리
    onDone?.();
  };

  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">새 비밀번호</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="8자 이상, 영문/숫자/특수문자 조합 권장"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500"
            >
              {show ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
          <input
            type={show ? 'text' : 'password'}
            value={pw2}
            onChange={e => setPw2(e.target.value)}
            placeholder="다시 입력"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {err && <p className="text-sm text-red-500">{err}</p>}

      <div className="-mx-6 mt-auto border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="ghost" size="md" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" variant="primary" size="md">
          저장
        </Button>
      </div>
    </div>
  );
}

export default PasswordChange;
