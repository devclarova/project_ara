// src/utils/profanity.ts

// ✅ ESM/CJS 호환 래퍼
import * as LEO_RAW from 'leo-profanity';
const leo: {
  add: (words: string[] | string) => void;
  remove: (words: string[] | string) => void;
  clearList: () => void;
  getDictionary: (lang: string) => string[];
  list: () => string[];
  check: (text: string) => boolean;
  clean: (text: string) => string;
} = (LEO_RAW as any).default ?? (LEO_RAW as any);

// ---------- 유틸/정규화 ----------
const L33T_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
  '@': 'a', '$': 's', '!': 'i',
};

let SUPPORTS_UNICODE_PROPS = true;
try { new RegExp('\\p{L}', 'u'); } catch { SUPPORTS_UNICODE_PROPS = false; }

const NON_WORD_RE =
  SUPPORTS_UNICODE_PROPS ? /[^\p{L}\p{N}\s]/gu : /[^A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g;

function safeNormalize(s: string, form: 'NFKC' | 'NFC' = 'NFKC'): string {
  const anyStr = s as any;
  if (anyStr && typeof anyStr.normalize === 'function') {
    try { return anyStr.normalize(form); } catch {}
  }
  return s;
}

export function normalizeForCheck(raw: string): string {
  const base = (raw ?? '').toString();
  const normed = safeNormalize(base, 'NFKC');
  const deLeet = normed.replace(/[013457@$!]/g, (ch: string) => L33T_MAP[ch] ?? ch);
  return deLeet.toLowerCase().replace(NON_WORD_RE, ' ').replace(/\s+/g, ' ').trim();
}

// ---------- 사전/초기화 ----------
let _initialized = false;
let _extraWords: string[] = []; // koWords + customWords - whiteList

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

export function initProfanity(customWords: string[] = [], whiteList: string[] = []): void {
  if (_initialized) return;

  // ⚠️ koWords = 마스킹 후보(넓게), 강차단은 아래 BLOCK_LIST에서 별도로
  const koWords: string[] = [
    '씨발','시발','십알','좆','좆같','조까','병신','븅신','등신','좃',
    '개새끼','꺼져','죽어','지랄','염병','엿먹','미친놈','미친년','또라이',
    '창녀','걸레','년놈','개새','개자식', '바보',
    'fuck','fucking','bitch','asshole','shit','damn','crap','jerk','suck','moron','stupid',
  ];

  // leo 내부 사전 구성
  if (typeof leo.clearList === 'function') leo.clearList();
  if (typeof leo.getDictionary === 'function') {
    const en = leo.getDictionary('en');
    if (en?.length) leo.add(en);
  }
  if (koWords.length) leo.add(koWords);
  if (customWords.length) leo.add(customWords);
  if (whiteList.length) leo.remove(whiteList);

  const afterLeo: string[] = (typeof leo.list === 'function') ? leo.list() : [];
  _extraWords = uniq(
    afterLeo.concat(koWords).concat(customWords).filter((w: string) => !whiteList.includes(w))
  );

  _initialized = true;
}

// ---------- 강차단(무조건 block) ----------
const BLOCK_LIST = new Set<string>([
  '씨발','ㅅㅂ','ㄱㅅㄲ','ㅁㅊ','미친','병신','호로','잡년','썅','장애','개새끼',
  '개같','개판','개지랄','ㅈㄴ','ㅂㅅ','ㅄ','ㅆㅂ','염병','닥쳐','지랄같','엿같',
  '나쁜년','나쁜놈','개놈','쓰레기','시바', '멍청이',
  'fuck','motherfucker','nigger','retard', '느금마', '니애미', '니어미', '마약', '필로폰', '대마초',
  '대포통장', '사기', '도박', '죽여', '죽일', '패', '때려','문재앙', '박근혜', '노무현', '좌빨', '수꼴', '일베충',
  '쳐죽', '쳐맞', '쳐패','한남', '한남충', '김치남', '김치녀','병신', '병쉰', '병시인', 'ㅂㅅ', 'ㅂ1ㅅ',
  '지랄', '지럴', 'ㅇㅈㄹ', 'ㅈㄹ',
  '좆', '존나', '졸라', 'ㅈㄴ', 'ㅈ나',
  '새끼', '쉐끼', '쌔끼', '색히',
  '닥쳐', '닥치', '엠창', '엠챵',
  '꺼져', '꺼지', '꺼여','시발', '씨발', '시bal', '씨bal', 'ㅅㅂ', 'ㅆㅂ', 'sibal',
  '개새끼', '개새키', '개색', '개색기', 'ㄱㅅㄲ', 'ㄱㅅㅋ',
  '죽어', '뒤져', '뒤지',
  '맘충', '틀딱', '급식충', '잼민이',
  '홍어', '된장녀', '김여사','보지', 'ㅂㅈ', '버지',
  '자지', 'ㅈㅈ', '잦지',
  '섹스', '섹수', 'sex', 'SEX',
  '야동', '야딩',
  '강간', '성폭행',
  '토토', '배팅',
  '애미', '애비', '아가리', '주둥이', '븅신', '멍청이', '바보','장애인', '정신병자', '미친', '또라이',
  '찐따', '루저', 'loser',
]);

// ---------- 마스킹 ----------
function maskWithHits(raw: string, hits: string[]): string {
  if (!hits.length) return raw;
  const sorted: string[] = [...hits].sort((a: string, b: string) => b.length - a.length);
  let out = raw;
  for (const w of sorted as string[]) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, (m: string) => '*'.repeat(m.length));
  }
  return out;
}

// ---------- 공개 API ----------
export type CheckResult = {
  ok: boolean;
  action: 'allow' | 'mask' | 'block';
  cleanText: string;
  hits: string[];
};

export function checkMessage(text: string): CheckResult {
  const normalized = normalizeForCheck(text);

  // 1) 강차단
  const blockHits: string[] = Array.from(BLOCK_LIST).filter((w: string) => normalized.includes(w));
  if (blockHits.length > 0) {
    return { ok: false, action: 'block', cleanText: '', hits: blockHits };
  }

  // 2) 마스킹
  const dict: string[] = _extraWords.length
    ? _extraWords
    : (typeof leo.list === 'function' ? leo.list() : []);
  const hits: string[] = dict.filter((w: string) => normalized.includes(w));

  if (hits.length > 0) {
    const cleanText = maskWithHits(text, hits);
    return { ok: true, action: 'mask', cleanText, hits };
  }

  // 3) 안전
  return { ok: true, action: 'allow', cleanText: text, hits: [] };
}
