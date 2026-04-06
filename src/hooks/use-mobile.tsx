import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * 반응형 뷰포트 감지 훅(Responsive Viewport Detector)
 * - 브라우저 윈도우 크기를 매치 미디어(`matchMedia`)를 통해 실시간 감지하여 모바일 임계치(768px) 판단
 * - 전역 레이아웃의 반응형 분기 처리를 위한 표준 상태 제공
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
