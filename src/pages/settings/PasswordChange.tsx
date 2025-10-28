import Button from '@/components/common/Buttons';
import { useEffect, useState } from 'react';

function PasswordChange({ onDone, onClose }: { onDone?: () => void; onClose?: () => void }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pw3, setPw3] = useState('');
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 새 비밀번호 일치 여부 검사
  const passwordsMatch = pw2 === pw3;
  const canSubmit = pw.length >= 8 && pw2.length >= 8 && passwordsMatch;

  // 비밀번호 확인 중 불일치 시 즉시 에러 메시지 표시
  useEffect(() => {
    if (pw2 && pw3 && !passwordsMatch) {
      setErr('새 비밀번호가 일치하지 않습니다.');
    } else {
      setErr(null);
    }
  }, [pw2, pw3, passwordsMatch]);

  const submit = () => {
    if (!canSubmit) {
      setErr('비밀번호를 확인해주세요. (8자 이상 & 동일 입력)');
      return;
    }
    // TODO: 실제 비밀번호 변경 API 호출
    onDone?.();
  };

  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">기존 비밀번호</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pr-2"
            >
              {show ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">새 비밀번호</label>
          <div className="relative">
            <input
              type={show2 ? 'text' : 'password'}
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
            />
            <button
              type="button"
              onClick={() => setShow2(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pr-2"
            >
              {show2 ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
          <div className="relative">
            <input
              type={show3 ? 'text' : 'password'}
              value={pw3}
              onChange={e => setPw3(e.target.value)}
              placeholder="다시 입력해주세요"
              className="mb-2 mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
            />
            <button
              type="button"
              onClick={() => setShow3(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pr-2"
            >
              {show3 ? 'HIDE' : 'SHOW'}
            </button>
          </div>
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
