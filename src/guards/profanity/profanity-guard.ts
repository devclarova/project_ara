import { checkMessage, initProfanity } from "@/utils/safety";

// 필요시 콘솔 디버깅
const DEBUG = false;
const log = (...a: any[]) => { if (DEBUG) console.log('[profanity-guard]', ...a); };

// StrictMode 중복 실행 방지
declare global { interface Window { __profanityGuardBound?: boolean } }

if (typeof window !== 'undefined' && !window.__profanityGuardBound) {
  window.__profanityGuardBound = true;

  initProfanity(); // 사전 초기화
  log('initialized');

  // React와 값 싱크
  function applyMask(textarea: HTMLTextAreaElement, cleanText: string) {
    if (textarea.value !== cleanText) {
      textarea.value = cleanText;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // 제출(버튼/마우스) 경로: form.submit 전역 캡처
  function onSubmitCapture(e: Event) {
    const target = e.target as Element | null;
    if (!target?.matches?.('form.message-form')) return;

    const textarea = target.querySelector<HTMLTextAreaElement>('.message-textarea');
    if (!textarea) return;

    const original = textarea.value ?? '';
    const result = checkMessage(original);

    if (result.action === 'block') {
      e.preventDefault();
      e.stopPropagation();
      alert('부적절한 표현이 포함되어 전송이 차단되었습니다.');
      log('block via submit:', result.hits);
      return;
    }

    if (result.action === 'mask') {
      applyMask(textarea, result.cleanText);
      log('mask via submit:', result.hits);
      // 전송 계속
    }
  }

  // Enter 전송 경로: keydown 전역 캡처
  function onKeydownCapture(e: KeyboardEvent) {
    if (e.key !== 'Enter' || e.shiftKey) return;

    const target = e.target as Element | null;
    if (!target?.matches?.('.message-textarea')) return;

    const textarea = target as HTMLTextAreaElement;
    const original = textarea.value ?? '';
    const result = checkMessage(original);

    if (result.action === 'block') {
      e.preventDefault();
      e.stopPropagation();
      alert('부적절한 표현이 포함되어 전송이 차단되었습니다.');
      log('block via keydown:', result.hits);
      return;
    }

    if (result.action === 'mask') {
      applyMask(textarea, result.cleanText);
      log('mask via keydown:', result.hits);
      // 마스킹만 반영하고 기존 엔터 전송 흐름은 그대로
    }
  }

  document.addEventListener('submit', onSubmitCapture, true);
  document.addEventListener('keydown', onKeydownCapture, true);

  // 정리
  window.addEventListener('beforeunload', () => {
    document.removeEventListener('submit', onSubmitCapture, true);
    document.removeEventListener('keydown', onKeydownCapture, true);
  });
}
