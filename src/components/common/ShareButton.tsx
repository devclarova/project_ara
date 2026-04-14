/**
 * 유니버설 콘텐츠 공유 엔진(Universal Content Sharing Engine):
 * - 목적(Why): 서비스 내 주요 콘텐츠를 외부 소셜 플랫폼이나 클립보드로 전파하여 유입 경로를 확장함
 * - 방법(How): Web Share API를 통한 네이티브 공유 환경을 우선 제공하고, 미지원 브라우저에서는 클립보드 복사(Clipboard API) 및 정규화된 URL 추출 알고리즘으로 대체 실행함
 */
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
    typeof navigator !== 'undefined' && 'share' in navigator;

  // Canonical Analysis: Extracts the optimal shared URL by prioritizing props, canonical tags, and window location.
  const shareUrl = useMemo(() => {
    return url ?? getCanonicalUrl() ?? window.location.href;
  }, [url]);

  // 공유 데이터 구성
  const shareData = useMemo(() => {
    return {
      title: (title ?? document.title).slice(0, 80),
      text: (text ?? t('common.share_default_text', '재미있게 한국어를 배워요! ARA에서 학습 장면을 공유합니다.')).slice(0, 200),
      url: shareUrl,
    };
  }, [title, text, shareUrl, t]);

  // Clipboard Bridge: Interfaces with the navigator.clipboard API for link copying, with a prompt-based fallback.
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShared?.();
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt(t('common.copy_link_prompt', '아래 링크를 복사하세요:'), shareUrl);
    }
  };

  // Native Intent Invocation: Leverages the Web Share API for native OS sharing, failing back to clipboard operations in unsupported environments.
  const share = async () => {
    if (canUseShare) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share(shareData);
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
            alt={t('common.thumbnail', '썸네일')}
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
