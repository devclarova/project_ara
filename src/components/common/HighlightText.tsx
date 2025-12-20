interface HighlightTextProps {
  text: string;
  query?: string;
  className?: string; // 스타일 커스터마이징을 위한 prop
}

export default function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!query || query.trim() === '') return <>{text}</>;

  // 특수문자 이스케이프 (정규식 오류 방지)
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  // className이 제공되면 기본 색상(bg-primary/20 text-primary)을 쓰지 않고 provided className을 사용
  // 구조적 스타일(rounded-sm px-0.5)은 항상 유지
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
