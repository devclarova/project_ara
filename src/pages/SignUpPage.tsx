import React, { useEffect, useRef, useState } from 'react';

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface BirthInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  submitAttempted: boolean; // <- submit 여부
}

export default function BirthInput({
  value,
  onChange,
  submitAttempted,
}: BirthInputProps): JSX.Element {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());

  const rootRef = useRef<HTMLDivElement | null>(null);

  const formatFromDate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const formatInput = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    let res = digits;
    if (digits.length > 4) res = digits.slice(0, 4) + '-' + res.slice(4);
    if (digits.length > 6) res = res.slice(0, 7) + '-' + res.slice(7, 9);
    if (res.length > 10) res = res.slice(0, 10);
    return res;
  };

  const parsePartialToDate = (formatted: string): Date | null => {
    const digits = formatted.replace(/[^0-9]/g, '');
    if (digits.length < 4) return null;
    const y = Number(digits.slice(0, 4));
    if (Number.isNaN(y)) return null;
    if (digits.length < 6) return new Date(y, 0, 1);
    const m = Number(digits.slice(4, 6));
    if (Number.isNaN(m) || m < 1 || m > 12) return null;
    if (digits.length < 8) return new Date(y, m - 1, 1);
    const d = Number(digits.slice(6, 8));
    if (Number.isNaN(d) || d < 1 || d > 31) return null;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInput(e.target.value);
    setInputValue(formatted);

    const maybeDate = parsePartialToDate(formatted);
    if (maybeDate) {
      setSelectedDate(maybeDate);
      setViewYear(maybeDate.getFullYear());
      setViewMonth(maybeDate.getMonth());
    }
    setOpen(true);
  };

  const handleInputFocus = () => {
    setOpen(true);
  };

  const handleDateClick = (d: Date) => {
    setSelectedDate(d);
    setInputValue(formatFromDate(d));
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(false);
    onChange(d);
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedDate(null);
    setOpen(false);
    onChange(null);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="relative w-full max-w-full" ref={rootRef}>
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder="yyyy-mm-dd"
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className={`w-full px-4 h-12 rounded-lg border text-gray-900
            focus:outline-none focus:ring-0
            ${submitAttempted && !selectedDate ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}
          `}
        />
        {/* 달력 아이콘 */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="absolute right-8 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-700"
        >
          📅
        </button>
        {/* X 버튼 */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-700"
          >
            ✖
          </button>
        )}
        {/* 안내문구 바로 아래 표시 */}
        {submitAttempted && !selectedDate && (
          <p className="text-red-500 text-sm mt-1">생년월일을 입력해주세요.</p>
        )}
      </div>

      {/* Calendar popup */}
      {open && (
        <div className="absolute left-0 mt-2 w-72 bg-white border rounded shadow-lg z-20">
          {/* 달력 내용 생략 가능 */}
        </div>
      )}
    </div>
  );
}
