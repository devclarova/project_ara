/**
 * Exponential backoff와 함께 함수 실행을 재시도합니다.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    shouldRetry = (err: unknown) => {
      // 기본적으로 네트워크 오류(Failed to fetch)나 5xx 에러에 대해 재시도
      const e = err as Record<string, unknown> | null;
      const msg = (e?.message as string | undefined)?.toLowerCase() ?? '';
      const status = typeof e?.status === 'number' ? e.status : 0;
      return msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || status >= 500;
    },
    onRetry = () => {},
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      onRetry(error, attempt);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * 브라우저가 현재 온라인인지 확인하는 간단한 요법
 */
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.navigator.onLine;
};
