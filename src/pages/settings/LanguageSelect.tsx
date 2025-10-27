import Button from '@/components/common/Buttons';
import { useState } from 'react';

function LanguageSelect({ onClose }: { onClose?: () => void }) {
  const [lang, setLang] = useState('ko');
  return (
    <div className="flex flex-col min-h-[420px] text-gray-900 dark:text-gray-100 transition-colors">
      {/* 상단 영역 */}
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">표시 언어</p>
        <div className="space-y-2">
          {[
            { code: 'ko', label: '한국어' },
            { code: 'en', label: 'English' },
            { code: 'ja', label: '日本語' },
          ].map(l => (
            <label
              key={l.code}
              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors
            ${
              lang === l.code
                ? 'border-primary/70 bg-primary/5 dark:bg-primary/15 text-primary font-medium'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            >
              <span>{l.label}</span>
              <input
                type="radio"
                name="lang"
                checked={lang === l.code}
                onChange={() => setLang(l.code)}
                className="h-4 w-4 accent-primary dark:accent-primary"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 하단 버튼 영역 */}
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

export default LanguageSelect;
