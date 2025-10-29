import Button from '@/components/common/Buttons';
import { Monitor, Moon, Sun } from 'lucide-react';
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
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">표시 테마</p>
        <div className="flex-col items-center gap-2 rounded-lg p-1.5">
          {(
            [
              { key: 'light', label: '라이트', icon: <Sun className="w-4 h-4" /> },
              { key: 'dark', label: '다크', icon: <Moon className="w-4 h-4" /> },
              { key: 'system', label: '시스템', icon: <Monitor className="w-4 h-4" /> },
            ] as const
          ).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => set(key)}
              aria-pressed={mode === key}
              className={[
                'flex items-center gap-1.5 px-4 py-2 mb-2 rounded-lg transition-all duration-200 text-sm font-medium w-full h-12',
                mode === key
                  ? 'bg-gradient-to-r from-primary/80 to-primary text-white shadow-md scale-[1.03]'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-700/60',
              ].join(' ')}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-6 mt-auto dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
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
