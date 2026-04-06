/**
 * 키워드 기반 텍스트 하이라이팅 유닛(Keyword-based Text Highlighting Unit):
 * - 목적(Why): 검색 결과나 특정 매칭 텍스트에 대해 시각적 강조를 제공하여 정보 가시성을 극대화함
 * - 방법(How): 특수 문자 이스케이프 처리가 포함된 정규표현식(RegExp) 분할 방식을 통해 대소문자 구분 없이 매칭된 텍스트를 고유 스타일의 Span으로 래핑함
 */
interface HighlightTextProps {
  text: string;
  query?: string;
  className?: string; // Custom style injection for component appearance
}

export default function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!query || query.trim() === '') return <>{text}</>;

  // Input pattern normalization — Escaping special characters for safe RegExp construction
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  // Style Synthesis: Integrates external className overrides while maintaining standard structural tokens (padding/rounding).
  const styles = className
    ? `rounded-sm px-0.5 ${className}`
    : 'bg-primary/20 text-primary rounded-sm px-0.5';

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className={styles}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
