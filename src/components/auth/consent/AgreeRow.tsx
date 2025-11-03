import CheckboxSquare from '@/components/common/CheckboxSquare';

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
            상세보기
          </button>
        ) : (
          <span className="inline-block w-[72px]" />
        )}
      </div>
    </>
  );
}
