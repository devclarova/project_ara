import React, { useEffect, useRef, useState } from 'react';

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface BirthInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export default function BirthInput({ value, onChange }: BirthInputProps): JSX.Element {
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

  const handleDateChange = (date: Date | null) => {
    onChange(date);
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setInputValue(`${y}-${m}-${d}`);
    } else {
      setInputValue('');
    }
    (document.activeElement as HTMLElement)?.blur();
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
    } else {
      const digits = formatted.replace(/[^0-9]/g, '');
      if (digits.length >= 4) {
        const y = Number(digits.slice(0, 4));
        if (!Number.isNaN(y)) {
          setViewYear(y);
          if (digits.length >= 6) {
            const m = Number(digits.slice(4, 6));
            if (!Number.isNaN(m) && m >= 1 && m <= 12) setViewMonth(m - 1);
          }
        }
      }
    }
    setOpen(true);
  };

  const handleInputFocus = () => {
    if (!open) {
      // 달력이 이미 열려 있으면 다시 열지 않음
      setOpen(true);
    }

    const parsed = parsePartialToDate(inputValue);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    } else if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parsePartialToDate(inputValue);
      if (parsed) setSelectedDate(parsed);
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleDateClick = (d: Date) => {
    setSelectedDate(d);
    setInputValue(formatFromDate(d));
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(false); // 달력 닫기
    // inputRef.current?.focus(); <-- 이 줄 제거!
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
    setOpen(false);
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
  useEffect(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
      const y = Number(inputValue.slice(0, 4));
      const m = Number(inputValue.slice(5, 7));
      const d = Number(inputValue.slice(8, 10));
      const date = new Date(y, m - 1, d);
      if (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
      ) {
        setSelectedDate(date);
        setViewYear(date.getFullYear());
        setViewMonth(date.getMonth());
      }
    }
  }, [inputValue]);

  return (
    <div className="relative w-full max-w-full" ref={rootRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder="yyyy-mm-dd"
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="w-full px-4 h-12 rounded-lg border text-gray-900
             focus:outline-none focus:ring-0
             focus:border-[#00BFA5]
             focus:shadow-[0_0_0_2px_rgba(0,191,165,0.5)]"
        />
        {/* 달력 아이콘 */}
        <button
          type="button"
          onClick={() => {
            setOpen(o => !o);
            const parsed = parsePartialToDate(inputValue);
            if (parsed) {
              setViewYear(parsed.getFullYear());
              setViewMonth(parsed.getMonth());
            } else if (selectedDate) {
              setViewYear(selectedDate.getFullYear());
              setViewMonth(selectedDate.getMonth());
            }
            inputRef.current?.focus();
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-700"
        >
          📅
        </button>
        {/* X 버튼: 입력이 있을 때만 */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-700"
          >
            ✖
          </button>
        )}
      </div>

      {/* Calendar popup */}
      {open && (
        <div
          className="absolute left-0 mt-2 w-72 bg-white border rounded shadow-lg z-20"
          onMouseDown={e => e.stopPropagation()} // 이게 핵심!
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <button onClick={prevMonth} className="px-2 py-1 rounded hover:bg-gray-100">
              ‹
            </button>
            <div className="text-sm font-medium">
              {new Date(viewYear, viewMonth, 1).toLocaleString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <button onClick={nextMonth} className="px-2 py-1 rounded hover:bg-gray-100">
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
                >
                  <div className="text-sm text-center">{cell.date.getDate()}</div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                setViewYear(t.getFullYear());
                setViewMonth(t.getMonth());
                handleDateClick(t);
              }}
              className="text-sm px-2 py-1 rounded hover:bg-gray-100"
            >
              Today
            </button>
            <div className="text-xs text-gray-500">Type to jump months/years</div>
          </div>
        </div>
      )}
    </div>
  );
}
