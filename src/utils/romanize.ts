/**
 * Korean Romanization Utility (Revised):
 * - 정통 로마자 표기법(Revised Romanization of Korean) 준수
 */

const CHOSUNG = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];

const JUNGSUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 
  'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'
];

const JONGSUNG = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lg', 'lm', 'lb', 
  'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h'
];

export function romanizeKorean(text: string): string {
  if (!text) return '';
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 0xAC00;
    
    // 한글 범위 (가 ~ 힣)
    if (code >= 0 && code <= 11171) {
      const cho = Math.floor(code / 588);
      const jung = Math.floor((code % 588) / 28);
      const jong = code % 28;
      
      result += CHOSUNG[cho] + JUNGSUNG[jung] + JONGSUNG[jong];
    } else {
      result += text[i];
    }
  }
  
  return result;
}

export function hasKorean(text: string): boolean {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
}
