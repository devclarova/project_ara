/**
 * 테일윈드 스타일 합성 및 조건부 렌더링 유틸리티(Tailwind Style Composition & Conditional Utility):
 * - 목적(Why): 다양한 조건에 따른 CSS 클래스 결합 시 발생할 수 있는 충돌을 방지하고 코드 가독성을 높임
 * - 방법(How): clsx와 tailwind-merge를 결합하여 중복된 스타일을 제거하고 우선순위에 따른 최종 클래스 문자열을 생성함
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '알 수 없는 오류가 발생했습니다.';
}
