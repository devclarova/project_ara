import CheckboxSquare from '@/components/common/CheckboxSquare';
import { useTranslation } from 'react-i18next';

export default function AgreeRow({
  required = false,
  label,
  checked,
  onChange,
  onDetail,
}: {
  required?: boolean;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onDetail?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="py-2">
        <CheckboxSquare checked={checked} onChange={onChange} label={label} required={required} />
      </div>
      <div className="py-2">
        {onDetail ? (
          <button
            type="button"
            onClick={onDetail}
            className="text-[var(--ara-primary)] hover:underline font-semibold whitespace-nowrap"
          >
            {t('signup.detail_view')}
          </button>
        ) : (
          <span className="inline-block w-[72px]" />
        )}
      </div>
    </>
  );
}
