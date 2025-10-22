import React, { useEffect, useRef, useState } from 'react';

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface BirthInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: boolean;
  errorMessage?: string;
}

export default function BirthInput({
  value,
  onChange,
  error = false,
  errorMessage = '생년월일을 입력해주세요.',
}: BirthInputProps): JSX.Element {
  const [inputValue, setInputValue] = useState(value ? formatFromDate(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [open, setOpen] = useState<boolean>(false);
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());
  const rootRef = useRef<HTMLDivElement | null>(null);

  function formatFromDate(d: Date) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  const parseInputToDate = (raw: string): Date | null => {
    const digits = raw.replace(/[^0-9]/g, '');
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
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseInputToDate(raw);
    setSelectedDate(parsed);
    onChange(parsed);
    setOpen(true);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  };

  const handleDateClick = (d: Date) => {
    setSelectedDate(d);
    setInputValue(formatFromDate(d));
    onChange(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(false);
  };

  const prevMonth = () => {
    const date = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  const nextMonth = () => {
    const date = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedDate(null);
    onChange(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  // ⬇︎ (추가) 포커스가 컴포넌트 바깥으로 나가면 달력 닫기
  const handleWrapperBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (!rootRef.current || !next) {
      setOpen(false);
      return;
    }
    if (!rootRef.current.contains(next)) setOpen(false);
  };

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(ev.target as Node)) {
        setOpen(false);
        inputRef.current?.blur(); // ← 포커스도 제거해서 ring 확실히 종료
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const buildDaysGrid = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    for (let i = 0; i < startWeekday; i++)
      cells.push({ date: new Date(year, month, i - startWeekday + 1), inMonth: false });
    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ date: new Date(year, month, d), inMonth: true });
    while (cells.length % 7 !== 0)
      cells.push({
        date: new Date(year, month + 1, cells.length - startWeekday + 1),
        inMonth: false,
      });
    return cells;
  };

  const days = buildDaysGrid(viewYear, viewMonth);

  return (
    <div
      className="w-full relative"
      ref={rootRef}
      onBlur={handleWrapperBlur} // ⬅︎ (추가)
    >
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') setOpen(false); // ⬅︎ (추가) ESC로 닫기
            if (e.key === 'Tab') setOpen(false); // ⬅︎ (추가) Tab 이동 시 닫기
            if (e.key === 'Enter') {
              e.preventDefault();
              const parsed = parseInputToDate(inputValue);
              if (parsed) {
                setSelectedDate(parsed);
                setInputValue(formatFromDate(parsed));
                onChange(parsed);
                setViewYear(parsed.getFullYear());
                setViewMonth(parsed.getMonth());
                setOpen(false);
                inputRef.current?.blur();
              } else {
                console.warn('Please enter the date in a valid format.');
              }
            }
          }}
          placeholder=" "
          aria-haspopup="dialog" // ⬅︎ (추가) a11y
          aria-expanded={open} // ⬅︎ (추가)
          aria-controls="birth-popover" // ⬅︎ (추가)
          className={`peer w-full px-3 py-3 border rounded-[14px] bg-white text-black text-sm ${error ? 'border-red-500' : 'border-gray-300'} ara-focus`}
        />
        <label
          className={`absolute left-3 transition-all text-gray-400 bg-white/95 px-1 rounded
      ${inputValue ? '-top-2 text-xs' : 'top-3 text-sm'}
      peer-focus:-top-3 peer-focus:text-xs peer-focus:text-primary`}
        >
          생년월일
        </label>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="absolute right-8 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-700"
          aria-label="Toggle calendar"
        >
          <img src="/images/calendar.png" alt="달력" className="w-5" />
        </button>
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-secondary hover:text-secondary hover:opacity-75"
            aria-label="Clear date"
          >
            ✖
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{errorMessage}</p>}

      {open && (
        <div
          id="birth-popover" // ⬅︎ (추가)
          role="dialog" // ⬅︎ (추가)
          className="absolute left-0 bottom-full mb-4 w-72 bg-white border rounded shadow-lg z-50 max-h-80 overflow-auto"
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <button
              onClick={prevMonth}
              className="px-2 py-1 rounded hover:bg-gray-100"
              type="button"
            >
              ‹
            </button>
            <div className="text-sm font-medium">
              {new Date(viewYear, viewMonth, 1).toLocaleString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <button
              onClick={nextMonth}
              className="px-2 py-1 rounded hover:bg-gray-100"
              type="button"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 text-xs text-center px-2 pt-2">
            {WEEK_DAYS.map(wd => (
              <div key={wd} className="py-1 font-medium text-gray-600">
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 p-2">
            {days.map((cell, idx) => {
              const isSelected =
                selectedDate &&
                cell.date.getFullYear() === selectedDate.getFullYear() &&
                cell.date.getMonth() === selectedDate.getMonth() &&
                cell.date.getDate() === selectedDate.getDate();
              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(cell.date)}
                  className={[
                    'py-1 rounded',
                    cell.inMonth ? 'cursor-pointer' : 'cursor-default opacity-40',
                    isSelected ? 'bg-teal-500 text-white' : 'hover:bg-gray-100',
                  ].join(' ')}
                  disabled={!cell.inMonth}
                  aria-pressed={isSelected ?? undefined}
                  type="button"
                >
                  <div className="text-sm text-center">{cell.date.getDate()}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
