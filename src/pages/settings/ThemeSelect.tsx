import Button from '@/components/common/Buttons';
import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';

function ThemeSelect({ onClose }: { onClose?: () => void }) {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    const m = (document.documentElement.dataset.themeMode as Mode) || 'system';
    setMode(m);
  }, []);

  const set = (m: Mode) => {
    (window as any).__setTheme?.(m);
    setMode(m);
  };

  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">표시 테마</p>
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          {(['light', 'dark', 'system'] as const).map(m => (
            <button
              key={m}
              onClick={() => set(m)}
              className={[
                'px-3 py-1.5 transition',
                mode === m
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800',
              ].join(' ')}
              aria-pressed={mode === m}
            >
              {m === 'light' ? '라이트' : m === 'dark' ? '다크' : '시스템'}
            </button>
          ))}
        </div>
      </div>

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
export default ThemeSelect;
