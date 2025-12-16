import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ShareButtonProps = {
  title?: string;
  text?: string;
  url?: string;
  thumbnailUrl?: string;
  linkUrl?: string;
  className?: string;
  onShared?: () => void;
};

function getCanonicalUrl(): string | null {
  const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  return link?.href ?? null;
}

export default function ShareButton({
  title,
  text,
  url,
  thumbnailUrl,
  linkUrl,
  className = '',
  onShared,
}: ShareButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const canUseShare =
    typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';

  // 공유 URL 결정
  const shareUrl = useMemo(() => {
    return url ?? getCanonicalUrl() ?? window.location.href;
  }, [url]);

  // 공유 데이터 구성
  const shareData = useMemo(() => {
    return {
      title: (title ?? document.title).slice(0, 80),
      text: (text ?? '재미있게 한국어를 배워요! ARA에서 학습 장면을 공유합니다.').slice(0, 200),
      url: shareUrl,
    };
  }, [title, text, shareUrl]);

  // URL 복사 공통 함수
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShared?.();
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('아래 링크를 복사하세요:', shareUrl);
    }
  };

  // 공유 실행
  const share = async () => {
    if (canUseShare) {
      try {
        await (navigator as any).share(shareData);
        onShared?.();
        return;
      } catch {
        // share 실패 시 fallback
      }
    }
    copyToClipboard();
  };

  return (
    <div className="relative inline-flex items-center gap-3">
      {/* 썸네일 미리보기 (클릭 시 이동) */}
      {thumbnailUrl && (
        <a
          href={linkUrl ?? shareUrl}
          className="group block rounded-md overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
          style={{ width: 80, height: 45 }}
        >
          <img
            src={thumbnailUrl}
            alt="thumbnail"
            className="w-full h-full object-cover group-hover:opacity-90 transition"
          />
        </a>
      )}

      {/* 공유 버튼 */}
      <button
        type="button"
        onClick={share}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm
        border-gray-200 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-100 transition ${className}`}
        aria-label={t('common.share', '공유')}
        title={t('common.share', '공유')}
      >
        <i className="ri-share-forward-line text-base" />
        <span className="hidden sm:inline">{t('common.share', '공유')}</span>
      </button>

      {/* 복사 완료 미니 토스트 */}
      <div
        className={`pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2
        rounded-md px-3 py-1 text-xs shadow bg-gray-900 text-white
        transition-opacity duration-200
        ${copied ? 'opacity-100' : 'opacity-0'}`}
      >
        {t('common.link_copied', '링크가 복사되었습니다')}
      </div>
    </div>
  );
}
