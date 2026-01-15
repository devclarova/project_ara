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
      <div className="py-2 xs:py-1.5 min-w-0 flex-1">
        <CheckboxSquare checked={checked} onChange={onChange} label={label} required={required} />
      </div>
      <div className="py-2 xs:py-1.5 flex items-start justify-end flex-shrink-0 mt-0.5">
        {onDetail ? (
          <button
            type="button"
            onClick={onDetail}
            className="text-[var(--ara-primary)] hover:underline font-semibold whitespace-nowrap xs:text-[11px] text-sm"
          >
            {t('signup.detail_view')}
          </button>
        ) : (
          <span className="inline-block w-[72px] xs:w-[44px] flex-shrink-0" />
        )}
      </div>
    </>
  );
}
