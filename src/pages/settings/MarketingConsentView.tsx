import Button from '@/components/common/Buttons';
import { useState } from 'react';

// 마케팅 수신 동의
export function MarketingConsentView({
  onSaved,
  onClose,
}: {
  onSaved?: () => void;
  onClose?: () => void;
}) {
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(true);
  const [push, setPush] = useState(true);

  const save = () => {
    // TODO: API 저장
    onSaved?.();
  };

  const Item = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
      <span className="text-sm text-gray-800">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );

  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          이벤트/혜택 알림 수신 채널을 선택하세요. 언제든 설정에서 변경할 수 있습니다.
        </p>
        <div className="space-y-2">
          <Item label="이메일 수신" checked={email} onChange={setEmail} />
          <Item label="SMS 수신" checked={sms} onChange={setSms} />
          <Item label="푸시 알림" checked={push} onChange={setPush} />
        </div>
      </div>
      <div className="-mx-6 mt-auto dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="ghost" size="md" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" size="md" variant="primary">
          저장
        </Button>
      </div>
    </div>
  );
}
