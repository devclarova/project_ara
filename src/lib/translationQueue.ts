/**
 * 글로벌 번역 요청 큐(Global Translation Request Queue):
 * - 목적: 모든 번역 훅(useBatchAutoTranslation, useAutoTranslation)의 fetch를 단일 큐로 통합하여
 *   OpenAI 429 rate limit을 원천 차단
 * - 동작: 동시 요청 수를 MAX_CONCURRENT로 제한하고, 429/5xx 응답 시 exponential backoff로 자동 재시도
 */

const MAX_CONCURRENT = 5;
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

let active = 0;
const queue: Array<{ resolve: () => void }> = [];

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  return new Promise<void>((resolve) => {
    queue.push({ resolve });
  });
}

function release(): void {
  active--;
  if (queue.length > 0) {
    const next = queue.shift()!;
    active++;
    next.resolve();
  }
}

/**
 * 큐를 통한 fetch 래퍼 — 동시 요청 수 제한 + 429/5xx 자동 재시도
 * 기존 fetch와 동일한 시그니처로 드롭인 교체 가능
 */
export async function queuedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  await acquire();
  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(url, options);

      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[TranslationQueue] ${response.status} → retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return response;
    }
    // 최종 폴백 — 마지막 시도
    return await fetch(url, options);
  } finally {
    release();
  }
}
