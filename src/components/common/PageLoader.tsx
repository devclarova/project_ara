/**
 * 고정 레이어 전체화면 페이지 로더(Fixed Full-screen Page Loader):
 * - 목적(Why): 대규모 데이터 fetch나 라우팅 전환 시 사용자에게 현재 진행 상태를 명확히 인지시켜 이탈을 방지함
 * - 방법(How): 최고순위 z-index와 backdrop-blur를 적용한 오버레이 위에서 애니메이션 스피너와 브랜딩 텍스트를 결합하여 고품질 UX 피드백을 제공함
 */
export default function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm fixed inset-0 z-[9999]">
      <div className="relative">
        {/* UX Feedback: Implements an infinite rotation spinner with glow effects to signal ongoing data synchronization. */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]" />
        <div className="absolute inset-x-0 -bottom-8 text-center text-[10px] font-black tracking-[0.2em] text-primary/60 uppercase animate-pulse">
          Loading Data
        </div>
      </div>
    </div>
  );
}
