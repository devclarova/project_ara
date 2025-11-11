import { useEffect, useMemo, useState } from 'react';

type ShareButtonProps = {
  title?: string;
  text?: string;
  url?: string;
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
  className = '',
  onShared,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const canUseShare =
    typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';

  // 기본값: Helmet canonical → 없으면 현재 URL
  const shareUrl = useMemo(() => {
    return url ?? getCanonicalUrl() ?? window.location.href;
  }, [url]);

  const shareData = useMemo(() => {
    const safeTitle = (title ?? document.title).slice(0, 80);
    const safeText = (text ?? '재미있게 한국어를 배워요! ARA에서 학습 장면을 공유합니다.').slice(
      0,
      200,
    );
    return { title: safeTitle, text: safeText, url: shareUrl };
  }, [title, text, shareUrl]);

  const share = async () => {
    try {
      if (canUseShare) {
        await (navigator as any).share(shareData);
        onShared?.();
        return;
      }
      // Fallback: copy link
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShared?.();
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      // 최후 폴백: prompt
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch {
        // eslint-disable-next-line no-alert
        window.prompt('아래 링크를 복사하세요:', shareUrl);
      }
    }
  };

  // HTTPS 아닌 경우 Clipboard API가 막힐 수 있음 → 경고 표시(선택)
  const [insecure, setInsecure] = useState(false);
  useEffect(() => {
    if (window.location.protocol !== 'https:') setInsecure(true);
  }, []);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={share}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm
        border-gray-200 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-100 transition ${className}`}
        aria-label="공유하기"
        title="공유하기"
      >
        <i className="ri-share-forward-line text-base" />
        <span className="hidden sm:inline">공유</span>
      </button>

      {/* 미니 토스트 */}
      <div
        className={`pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2
        rounded-md px-3 py-1 text-xs shadow
        bg-gray-900 text-white transition-opacity duration-200
        ${copied ? 'opacity-100' : 'opacity-0'}`}
        role="status"
        aria-live="polite"
      >
        링크가 복사되었습니다
      </div>

      {/* 비HTTPS 경고(선택 표시) */}
      {/* {insecure && (
        <div className="absolute -bottom-10 left-0 translate-y-2 text-xs text-amber-600 dark:text-amber-400">
          비보안 환경에서는 일부 공유/복사가 제한될 수 있어요
        </div>
      )} */}
    </div>
  );
}
