/**
 * 텍스트 입력 필드(Input)
 * - 목적: 애플리케이션 전반에서 일관된 입력 폼 경험을 제공하고, 테마(Light/Dark)에 따른 시각적 피드백을 통합 관리하기 위함
 * - 방식: HTML5 input 엘리먼트를 래핑하여 디자인 시스템의 포커스(Ring), 보더, 비활성 상태 스타일을 강제 적용
 */
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-secondary px-3 py-1 text-base text-gray-900 dark:text-gray-100 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
