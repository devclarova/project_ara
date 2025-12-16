import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Mode = 'year' | 'month' | 'day';

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
  errorMessage,
}: BirthInputProps): JSX.Element {
  const { t } = useTranslation();
  const defaultErrorMessage = errorMessage || t('signup.error_birth_required');
  const maxDate14 = (() => {
    const t = new Date();
    return new Date(t.getFullYear() - 14, t.getMonth(), t.getDate());
  })();

  const [mode, setMode] = useState<Mode>('day');

  const [inputValue, setInputValue] = useState(value ? formatFromDate(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [open, setOpen] = useState<boolean>(false);

  const [viewYear, setViewYear] = useState<number>((value ?? maxDate14).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>((value ?? maxDate14).getMonth());
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

    if (parsed && parsed > maxDate14) {
      setSelectedDate(null);
      onChange(null);
    } else {
      setSelectedDate(parsed);
      onChange(parsed);
    }

    setOpen(true);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      setMode('day');
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

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(ev.target as Node)) {
        setOpen(false);
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
    while (cells.length % 7 !== 0) {
      cells.push({
        date: new Date(year, month + 1, cells.length - startWeekday + 1),
        inMonth: false,
      });
    }
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      cells.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        inMonth: false,
      });
    }
    return cells;
  };

  const days = buildDaysGrid(viewYear, viewMonth);

  return (
    <div className="w-full relative" ref={rootRef}>
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setMode('day');
            if (!selectedDate) {
              setViewYear(maxDate14.getFullYear());
              setViewMonth(maxDate14.getMonth());
            }
            setOpen(true);
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Tab') setOpen(false);
            if (e.key === 'Enter') {
              e.preventDefault();
              const parsed = parseInputToDate(inputValue);
              if (parsed) {
                if (parsed > maxDate14) return;
                setSelectedDate(parsed);
                setInputValue(formatFromDate(parsed));
                onChange(parsed);
                setViewYear(parsed.getFullYear());
                setViewMonth(parsed.getMonth());
                setOpen(false);
              }
            }
          }}
          placeholder=" "
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="birth-popover"
          className={`peer w-full px-3 py-3 border rounded-[14px] bg-white text-black text-sm dark:bg-secondary dark:text-gray-300 ${
            error
              ? 'ara-focus--error border-red-500'
              : 'ara-focus border-gray-300 dark:border-[#D1D5DB]'
          }`}
        />
        <label
          className={`absolute left-3 transition-all text-gray-400 bg-white/95 rounded dark:bg-secondary
      ${inputValue ? '-top-2 text-xs' : 'top-3 text-sm'}
      peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary`}
        >
          {t('signup.label_birth')}
        </label>
        <button
          type="button"
          onClick={() => {
            setMode(prev => (open ? prev : selectedDate ? 'day' : 'month'));
            setOpen(o => !o);
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 px-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white/90"
          aria-label="Toggle calendar"
        >
          <img src="/images/calendar.png" alt={t('signup.calendar_alt')} className="w-5" />
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

      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{defaultErrorMessage}</p>}

      {open && (
        <div
          id="birth-popover"
          role="dialog"
          className="absolute left-0 bottom-full mb-4 w-72 bg-white dark:bg-secondary dark:text-gray-300 border border-gray-300 dark:border-[#D1D5DB] rounded-[14px] shadow-lg z-50 max-h-80 overflow-auto"
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-[#D1D5DB]">
            <button
              onClick={() => {
                if (mode === 'day') prevMonth();
                else if (mode === 'month') setViewYear(v => v - 1);
                else setViewYear(v => v - 20);
              }}
              className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
              type="button"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() =>
                setMode(m => (m === 'day' ? 'month' : m === 'month' ? 'year' : 'year'))
              }
              className="text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg.white/10"
              aria-label="Change view mode"
            >
              {mode === 'day' &&
                new Date(viewYear, viewMonth, 1).toLocaleString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              {mode === 'month' && `${viewYear}`}
              {mode === 'year' &&
                `${Math.floor(viewYear / 20) * 20}–${Math.floor(viewYear / 20) * 20 + 19}`}
            </button>
            <button
              onClick={() => {
                if (mode === 'day') nextMonth();
                else if (mode === 'month') setViewYear(v => v + 1);
                else setViewYear(v => v + 20);
              }}
              className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
              type="button"
            >
              ›
            </button>
          </div>

          {/* 연도 선택 */}
          {mode === 'year' && (
            <div className="grid grid-cols-4 gap-2 p-3">
              {Array.from({ length: 20 }).map((_, i) => {
                const base = Math.floor(viewYear / 20) * 20;
                const y = base + i;
                const disabled = y > maxDate14.getFullYear();
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setViewYear(y);
                      setMode('month');
                    }}
                    className={[
                      'py-2 rounded text-sm',
                      disabled
                        ? 'cursor-not-allowed opacity-40'
                        : 'hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer',
                    ].join(' ')}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* 월 선택 */}
          {mode === 'month' && (
            <div className="grid grid-cols-4 gap-2 p-3">
              {Array.from({ length: 12 }).map((_, m) => {
                const disabled =
                  viewYear > maxDate14.getFullYear() ||
                  (viewYear === maxDate14.getFullYear() && m > maxDate14.getMonth());
                const label = new Date(2000, m, 1).toLocaleString(undefined, { month: 'short' });
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setViewMonth(m);
                      setMode('day');
                    }}
                    className={[
                      'py-2 rounded text-sm',
                      disabled
                        ? 'cursor-not-allowed opacity-40'
                        : 'hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 일 선택 */}
          {mode === 'day' && (
            <>
              <div className="grid grid-cols-7 text-xs text-center px-2 pt-2">
                {WEEK_DAYS.map(wd => (
                  <div key={wd} className="py-1 font-medium text-gray-600 dark:text-gray-300">
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
                  const overMax = cell.date > maxDate14;
                  return (
                    <button
                      key={idx}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => !overMax && cell.inMonth && handleDateClick(cell.date)}
                      className={[
                        'py-1 rounded',
                        cell.inMonth
                          ? overMax
                            ? 'cursor-not-allowed opacity-40'
                            : 'cursor-pointer'
                          : 'cursor-default opacity-40',
                        isSelected
                          ? 'bg-teal-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-white/10',
                      ].join(' ')}
                      disabled={!cell.inMonth || overMax}
                      aria-pressed={isSelected ?? undefined}
                      type="button"
                    >
                      <div className="text-sm text-center">{cell.date.getDate()}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
