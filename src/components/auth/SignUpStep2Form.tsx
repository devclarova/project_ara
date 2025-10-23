import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import BirthInput from './BirthInput';
import CountrySelect from './CountrySelect';
import GenderSelect from './GenderSelect';
import InputField from './InputField';

const EMAIL_ASCII_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
// ASCII 전용(한글 등 비ASCII 포함 시 거르기)
const NON_ASCII_RE = /[^\x00-\x7F]/;

function validateEmailField(raw: string): string {
  const s = raw ?? '';

  if (!s.trim()) return '이메일을 입력해주세요.';

  // 공백 포함 즉시 차단 (맨 앞, 뒤, 중간 모두)
  if (/\s/.test(s)) return '이메일에 공백은 사용할 수 없습니다.';

  // 비ASCII(한글 등) 포함 즉시 차단
  if (NON_ASCII_RE.test(s)) return '이메일은 영문/숫자로만 입력해주세요.';

  // 1차 기본 형식(local@domain)
  if (!EMAIL_ASCII_RE.test(s)) return '올바르지 않은 이메일 형식입니다.';

  // 추가 안전검사
  if (s.length > 254) return '올바르지 않은 이메일 형식입니다.';
  const [local, domain] = s.split('@');
  if (!local || !domain) return '올바르지 않은 이메일 형식입니다.';
  if (local.length > 64) return '올바르지 않은 이메일 형식입니다.';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..'))
    return '올바르지 않은 이메일 형식입니다.';

  // 도메인 라벨 검증
  const labels = domain.split('.');
  if (labels.length < 2) return '올바르지 않은 이메일 형식입니다.';
  for (const lab of labels) {
    if (!/^[A-Za-z0-9-]{1,63}$/.test(lab)) return '올바르지 않은 이메일 형식입니다.';
    if (lab.startsWith('-') || lab.endsWith('-')) return '올바르지 않은 이메일 형식입니다.';
  }

  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,63}$/.test(tld)) return '올바르지 않은 이메일 형식입니다.';

  return '';
}

// 비밀번호 검증 규칙
const PW_LETTER_RE = /[A-Za-z]/;
const PW_NUMBER_RE = /[0-9]/;
const PW_SPECIAL_RE = /[!@#$%^&*]/;

function validatePasswordField(pw: string): string {
  const v = pw ?? '';
  if (!v) return '비밀번호를 입력해주세요.';
  if (/\s/.test(v)) return '비밀번호에 공백은 사용할 수 없습니다.';
  if (v.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  if (!PW_LETTER_RE.test(v) || !PW_NUMBER_RE.test(v) || !PW_SPECIAL_RE.test(v)) {
    return '문자, 숫자, 특수문자(!/@/#/$/%/^/&/*)를 모두 포함하세요.';
  }
  return '';
}

function validateConfirmPwField(confirm: string, pw: string): string {
  const c = confirm ?? '';
  if (!c) return '비밀번호 확인을 입력해주세요.';
  if (c !== (pw ?? '')) return '비밀번호가 일치하지 않습니다.';
  return '';
}

/** 닉네임 검증 유틸 */
type Lang =
  | 'ko'
  | 'en'
  | 'ja'
  | 'zh'
  | 'ru'
  | 'vi'
  | 'bn'
  | 'ar'
  | 'hi'
  | 'th'
  | 'es'
  | 'fr'
  | 'pt'
  | 'pt-br';

const RE = {
  ko: /^[가-힣0-9_]+$/,
  en: /^[A-Za-z0-9_]+$/,
  ja: /^[ぁ-ゟ゠-ヿｦ-ﾟ一-龯0-9_]+$/, // 히라/가타/반각가타/한자
  zh: /^[\u4E00-\u9FFF0-9_]+$/, // CJK 통합 한자
  ru: /^[\u0400-\u04FF0-9_]+$/,
  vi: /^[A-Za-zÀ-ỹ0-9_]+$/, // 베트남어 라틴 확장
  bn: /^[\u0980-\u09FF0-9_]+$/,
  ar: /^[\u0600-\u06FF0-9_]+$/,
  hi: /^[\u0900-\u097F0-9_]+$/,
  th: /^[\u0E00-\u0E7F0-9_]+$/,
  es: /^[A-Za-záéíóúñüÁÉÍÓÚÑÜ0-9_]+$/,
  fr: /^[A-Za-zàâçéèêëîïôùûüÀÂÇÉÈÊËÎÏÔÙÛÜ0-9_]+$/,
  pt: /^[A-Za-zãõçáéíóúÃÕÇÁÉÍÓÚ0-9_]+$/,
  'pt-br': /^[A-Za-záãâçéêíóôõúÁÃÂÇÉÊÍÓÔÕÚ0-9_]+$/,
} as const;

const LEN: Record<Lang, [number, number]> = {
  ko: [2, 6],
  en: [3, 12],
  ja: [2, 8],
  zh: [2, 8],
  ru: [3, 12],
  vi: [3, 10],
  bn: [2, 10],
  ar: [2, 10],
  hi: [2, 10],
  th: [2, 10],
  es: [3, 12],
  fr: [3, 12],
  pt: [3, 12],
  'pt-br': [3, 12],
};

const DIACRITIC_HINT = {
  es: /[áéíóúñüÁÉÍÓÚÑÜ]/,
  fr: /[àâçéèêëîïôùûüÀÂÇÉÈÊËÎÏÔÙÛÜ]/,
  pt: /[ãõçáéíóúÃÕÇÁÉÍÓÚ]/,
  'pt-br': /[áãâçéêíóôõúÁÃÂÇÉÊÍÓÔÕÚ]/,
  vi: /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/,
};

function hasOnlyOneScript(nick: string): boolean {
  // 허용된 문자(각 스크립트 + 숫자/언더바) 외 문자가 섞이면 false
  const allowedUnion =
    /[A-Za-z0-9_가-힣ぁ-ゟ゠-ヿｦ-ﾟ一-龯\u4E00-\u9FFF\u0400-\u04FF\u0980-\u09FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7FÀ-ỹáéíóúñüÁÉÍÓÚÑÜàâçéèêëîïôùûüÃÕÇãõç]/;
  for (const ch of nick) {
    if (!allowedUnion.test(ch)) return false;
  }
  // 스크립트 혼합 감지(간단 휴리스틱)
  const isKorean = /[가-힣]/.test(nick);
  const isKana = /[ぁ-ゟ゠-ヿｦ-ﾟ]/.test(nick);
  const isHan = /[\u4E00-\u9FFF]/.test(nick);
  const isCyr = /[\u0400-\u04FF]/.test(nick);
  const isAr = /[\u0600-\u06FF]/.test(nick);
  const isHi = /[\u0900-\u097F]/.test(nick);
  const isTh = /[\u0E00-\u0E7F]/.test(nick);
  const isBn = /[\u0980-\u09FF]/.test(nick);
  const isLatin = /[A-Za-zÀ-ỹ]/.test(nick);

  const count = [isKorean, isKana || isHan, isCyr, isAr, isHi, isTh, isBn, isLatin].filter(
    Boolean,
  ).length;
  // 일본어는 (히라/가타/한자) 혼용 허용 → 위에서 kana||han을 하나로 묶었다.
  return count <= 1;
}

function detectLang(nick: string): Lang | null {
  if (!nick) return null;
  if (/[가-힣]/.test(nick)) return 'ko';
  if (/[ぁ-ゟ゠-ヿｦ-ﾟ]/.test(nick)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(nick)) return 'zh';
  if (/[\u0400-\u04FF]/.test(nick)) return 'ru';
  if (/[\u0600-\u06FF]/.test(nick)) return 'ar';
  if (/[\u0900-\u097F]/.test(nick)) return 'hi';
  if (/[\u0E00-\u0E7F]/.test(nick)) return 'th';
  if (/[\u0980-\u09FF]/.test(nick)) return 'bn';
  // 라틴 확장 세부 판별
  if (DIACRITIC_HINT.vi.test(nick)) return 'vi';
  if (DIACRITIC_HINT['pt-br'].test(nick)) return 'pt-br';
  if (DIACRITIC_HINT.pt.test(nick)) return 'pt';
  if (DIACRITIC_HINT.fr.test(nick)) return 'fr';
  if (DIACRITIC_HINT.es.test(nick)) return 'es';
  if (/[A-Za-z]/.test(nick)) return 'en';
  return null;
}

function validateNicknameField(nickRaw: string): { error: string; lang: Lang | null } {
  const u = (nickRaw ?? '').trim();
  if (!u) return { error: '닉네임을 입력해주세요.', lang: null };
  if (/\s/.test(u)) return { error: '닉네임에 공백은 사용할 수 없습니다.', lang: null };
  if (/^\d+$/.test(u)) return { error: '숫자만으로는 닉네임을 만들 수 없습니다.', lang: null };
  if (/(.)\1\1/.test(u))
    return { error: '동일 문자를 3회 이상 연속 사용할 수 없습니다.', lang: null };
  const underscoreCount = u.length - u.replace(/_/g, '').length;
  if (underscoreCount > 2) return { error: '언더바는 최대 2개까지만 허용됩니다.', lang: null };

  if (!hasOnlyOneScript(u)) {
    return { error: '닉네임은 하나의 문자계열만 사용할 수 있습니다.', lang: null };
  }

  const lang = detectLang(u);
  if (!lang) return { error: '언어를 인식할 수 없습니다. 허용 문자만 사용해주세요.', lang: null };

  // 한글: 완성형만 허용(자모-only 금지는 정규식으로 자연 차단)
  const range = LEN[lang];
  if (!range) return { error: '지원하지 않는 언어입니다.', lang: null };
  const [min, max] = range;
  if (!RE[lang].test(u)) return { error: '허용되지 않은 문자가 포함되어 있습니다.', lang };
  if (u.length < min || u.length > max)
    return { error: `길이는 ${min}~${max}자만 가능합니다.`, lang };

  return { error: '', lang };
}

function langLabel(l?: Lang | null): string {
  if (!l) return '';
  const map: Record<Lang, string> = {
    ko: '한국어',
    en: '영어',
    ja: '일본어',
    zh: '중국어',
    ru: '러시아어',
    vi: '베트남어',
    bn: '벵골어',
    ar: '아랍어',
    hi: '힌디어',
    th: '태국어',
    es: '스페인어',
    fr: '프랑스어',
    pt: '포르투갈어',
    'pt-br': '브라질 포르투갈어',
  };
  return map[l] ?? l;
}

type Props = {
  onNext: (data: FormData) => void;
  onBack: () => void;
  value?: FormData;
  onChange?: (data: FormData) => void;
  verified: {
    email: { value: string; ok: boolean };
    nickname: { value: string; ok: boolean };
  };
  submitAttempted: boolean;
  onInvalidateByChange: (email: string, nickname: string) => void;
  onDupChecked: (which: 'email' | 'nickname', value: string, ok: boolean) => void;
};

export type FormData = {
  email: string;
  pw: string;
  confirmPw: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  country: string;
};

export default function SignUpStep2Form({
  onNext,
  onBack,
  value,
  onChange,
  verified,
  submitAttempted,
  onInvalidateByChange,
  onDupChecked,
}: Props) {
  // 내부 상태 초기화 (부모 값 우선)
  const [email, setEmail] = useState(value?.email ?? '');
  const [pw, setPw] = useState(value?.pw ?? '');
  const [confirmPw, setConfirmPw] = useState(value?.confirmPw ?? '');
  const [nickname, setNickname] = useState(value?.nickname ?? '');
  const [gender, setGender] = useState(value?.gender ?? '');
  const [birth, setBirth] = useState<Date | null>(value?.birth ?? null);
  const [country, setCountry] = useState(value?.country ?? '');

  // 감지된 닉네임 언어(검증 시 업데이트)
  const [nickLang, setNickLang] = useState<Lang | null>(null);

  // 부모 값이 바뀌면 내부 상태도 동기화
  useEffect(() => {
    if (!value) return;
    setEmail(value.email ?? '');
    setPw(value.pw ?? '');
    setConfirmPw(value.confirmPw ?? '');
    setNickname(value.nickname ?? '');
    setGender(value.gender ?? '');
    setBirth(value.birth ?? null);
    setCountry(value.country ?? '');
  }, [value]);

  // 부모로 변경 통지 헬퍼
  const emit = (next: FormData) => onChange?.(next);

  // 값이 바뀔 때마다 부모에 "캐시 무효화 판단" 요청
  useEffect(() => {
    onInvalidateByChange(email, nickname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, nickname]);

  // 부모 캐시와 현재 값이 같고 ok면, 로컬 표시는 'available'로 유지
  useEffect(() => {
    if (verified.email.ok && verified.email.value === email) {
      setEmailCheckResult('available');
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (verified.nickname.ok && verified.nickname.value === nickname) {
      setNickCheckResult('available');
      setErrors(prev => ({ ...prev, nickname: undefined }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified.email.value, verified.email.ok, verified.nickname.value, verified.nickname.ok]);

  // 외부(부모)에서 제출 시도가 생기면, 즉시 전체 검증 + 중복확인 힌트 노출
  useEffect(() => {
    if (submitAttempted) {
      validate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitAttempted]);

  const snapshot: FormData = useMemo(
    () => ({ email, pw, confirmPw, nickname, gender, birth, country }),
    [email, pw, confirmPw, nickname, gender, birth, country],
  );

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // 중복체크 버튼용 상태
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'taken' | ''>('');
  const [nickChecking, setNickChecking] = useState(false);
  const [nickCheckResult, setNickCheckResult] = useState<'available' | 'taken' | ''>('');

  const validate = (withDupHints = false): boolean => {
    const newErr: Partial<Record<keyof FormData, string>> = {};

    // (기존 형식/필수 검증 로직 그대로)
    const emailMsg = validateEmailField(email);
    if (emailMsg) newErr.email = emailMsg;

    const pwMsg = validatePasswordField(pw);
    if (pwMsg) newErr.pw = pwMsg;

    const confirmMsg = validateConfirmPwField(confirmPw, pw);
    if (confirmMsg) newErr.confirmPw = confirmMsg;

    const { error: nickMsg, lang } = validateNicknameField(nickname);
    setNickLang(lang);
    if (nickMsg) newErr.nickname = nickMsg;

    if (!gender) newErr.gender = '성별을 선택해주세요.';
    if (!birth) newErr.birth = '생년월일을 입력해주세요.';
    if (!country) newErr.country = '국적을 선택해주세요.';

    // ✅ 힌트 표시 시, '중복확인 캐시 OK'도 통과로 인정
    if (withDupHints) {
      const emailVerifiedOk = verified.email.ok && verified.email.value === email;
      const nickVerifiedOk = verified.nickname.ok && verified.nickname.value === nickname;

      if (!emailMsg && !emailVerifiedOk && emailCheckResult !== 'available') {
        newErr.email =
          emailCheckResult === 'taken'
            ? '해당 이메일은 이미 사용 중입니다.'
            : '이메일 중복확인을 진행해주세요.';
      }
      if (!nickMsg && !nickVerifiedOk && nickCheckResult !== 'available') {
        newErr.nickname =
          nickCheckResult === 'taken'
            ? '해당 닉네임은 이미 사용 중입니다.'
            : '닉네임 중복확인을 진행해주세요.';
      }
    }

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  // 이메일 중복 상태만 반환('available' | 'taken' | 'error')
  const emailDupStatus = async (): Promise<'available' | 'taken' | 'error'> => {
    const msg = validateEmailField(email);
    if (msg) {
      setErrors(prev => ({ ...prev, email: msg }));
      return 'error';
    }
    try {
      const v = email.trim();
      const { data, error } = await supabase.rpc('email_exists', { _email: v });
      if (error) {
        console.error('email_exists error:', error.message);
        return 'error';
      }
      return data === true ? 'taken' : 'available';
    } catch (e) {
      console.error('email_exists exception:', e);
      return 'error';
    }
  };

  // 닉네임 중복 상태만 반환('available' | 'taken' | 'error')
  // 서버 정책 검증까지 포함
  const nickDupStatus = async (): Promise<'available' | 'taken' | 'error'> => {
    const { error: nickMsg, lang } = validateNicknameField(nickname);
    setNickLang(lang);
    if (nickMsg || !lang) {
      setErrors(prev => ({ ...prev, nickname: nickMsg || '닉네임을 다시 확인해주세요.' }));
      return 'error';
    }

    try {
      // 1) 서버 정책(보호어/금칙어) — 있으면 사용
      const policyErr = await serverNicknamePolicyError(nickname, lang);
      if (policyErr) {
        setErrors(prev => ({ ...prev, nickname: policyErr }));
        return 'error';
      }

      // 2) 중복 여부
      const { data, error } = await supabase.rpc('nickname_exists', {
        _nickname: nickname,
        _lang: lang,
      } as any);
      if (error) {
        console.error('nickname_exists error:', error.message);
        return 'error';
      }
      return data === true ? 'taken' : 'available';
    } catch (e) {
      console.error('nickname_exists exception:', e);
      return 'error';
    }
  };

  const handleNext = async () => {
    // 1) 힌트 포함 검증으로 변경
    if (!validate(true)) return;

    // 2) 중복확인 캐시로 단축 (같은 값이면 재호출 없이 바로 통과)
    const cachedEmailOK = verified.email.ok && verified.email.value === email;
    const cachedNickOK = verified.nickname.ok && verified.nickname.value === nickname;

    if (cachedEmailOK && cachedNickOK) {
      onNext(snapshot);
      return;
    }

    setEmailChecking(true);
    setNickChecking(true);

    try {
      const [eRes, nRes] = await Promise.all([emailDupStatus(), nickDupStatus()]);

      setEmailCheckResult(eRes === 'available' ? 'available' : eRes === 'taken' ? 'taken' : '');
      setNickCheckResult(nRes === 'available' ? 'available' : nRes === 'taken' ? 'taken' : '');

      if (eRes === 'taken') {
        setErrors(prev => ({ ...prev, email: '해당 이메일은 이미 사용 중입니다.' }));
        return;
      }
      if (eRes === 'error') {
        setErrors(prev => ({ ...prev, email: '이메일 중복체크를 다시 시도해주세요.' }));
        return;
      }

      if (nRes === 'taken') {
        setErrors(prev => ({ ...prev, nickname: '해당 닉네임은 이미 사용 중입니다.' }));
        return;
      }
      if (nRes === 'error') {
        setErrors(prev => ({ ...prev, nickname: '닉네임 중복체크를 다시 시도해주세요.' }));
        return;
      }

      // 성공 시 부모 캐시 확정 + 다음 단계
      onDupChecked('email', email, true);
      onDupChecked('nickname', nickname, true);
      onNext(snapshot);
    } finally {
      setEmailChecking(false);
      setNickChecking(false);
    }
  };

  //   // 3) 닉네임 중복체크 검사 (반드시 'available'이어야 함)
  //   if (nickCheckResult !== 'available') {
  //     setErrors(prev => ({
  //       ...prev,
  //       nickname:
  //         nickCheckResult === 'taken'
  //           ? '해당 닉네임은 이미 사용 중입니다.'
  //           : '닉네임 중복체크를 먼저 진행해주세요.',
  //     }));
  //     return;
  //   }

  //   // 4) 모두 통과 → 다음 단계로
  //   onNext(snapshot);
  // };

  // 이메일 중복체크
  const handleEmailCheck = async () => {
    const msg = validateEmailField(email);
    if (msg) {
      setEmailCheckResult('');
      setErrors(prev => ({ ...prev, email: msg }));
      return;
    }

    setEmailChecking(true);
    try {
      const v = email.trim();
      const { data, error } = await supabase.rpc('email_exists', { _email: v });
      if (error) {
        console.error('email_exists error:', error.message);
        setEmailCheckResult('');
        return;
      }
      if (data === true) {
        setEmailCheckResult('taken');
        setErrors(prev => ({ ...prev, email: '해당 이메일은 이미 사용 중입니다.' }));
      } else {
        setEmailCheckResult('available');
        setErrors(prev => ({ ...prev, email: undefined }));
        // 성공 시 부모 캐시 확정
        onDupChecked('email', email, true);
      }
    } finally {
      setEmailChecking(false);
    }
  };

  // 서버 정책 검증 호출 (있으면 사용, 없으면 건너뜀)
  async function serverNicknamePolicyError(nick: string, lang: Lang): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('validate_nickname_policy', {
        in_nick: nick,
        in_lang: lang,
      } as any);
      if (error) {
        // 함수 미존재/에러 시 정책 검증을 스킵(중복체크만 진행)
        console.warn('validate_nickname_policy skipped:', error.message);
        return null;
      }
      // data === null 이면 통과, 문자열이면 그게 에러 메시지
      return data ?? null;
    } catch (e) {
      console.warn('validate_nickname_policy exception skip');
      return null;
    }
  }

  // 닉네임 중복체크 (정책 → 중복 순서)
  const handleNickCheck = async () => {
    // 1) 클라이언트 1차 검증
    const { error: nickMsg, lang } = validateNicknameField(nickname);
    setNickLang(lang);
    if (nickMsg || !lang) {
      setNickCheckResult('');
      setErrors(prev => ({ ...prev, nickname: nickMsg || '닉네임을 다시 확인해주세요.' }));
      return;
    }

    setNickChecking(true);
    try {
      // 2) 서버 정책 검증(보호어/금칙어) — 있으면 사용
      const policyErr = await serverNicknamePolicyError(nickname, lang);
      if (policyErr) {
        setNickCheckResult(''); // 사용불가
        setErrors(prev => ({ ...prev, nickname: policyErr }));
        return;
      }

      // 3) 중복 확인
      const { data, error } = await supabase.rpc('nickname_exists', {
        _nickname: nickname,
        _lang: lang,
      } as any);
      if (error) {
        console.error('nickname_exists error:', error.message);
        setNickCheckResult('');
        return;
      }
      if (data === true) {
        setNickCheckResult('taken');
        setErrors(prev => ({ ...prev, nickname: '해당 닉네임은 이미 사용 중입니다.' }));
      } else {
        setNickCheckResult('available');
        setErrors(prev => ({ ...prev, nickname: undefined }));
        // ✅ 성공 시 부모 캐시 확정
        onDupChecked('nickname', nickname, true);
      }
    } finally {
      setNickChecking(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">회원 정보 입력</h2>

      <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
        <InputField
          id="email"
          label="이메일"
          value={email}
          onChange={v => {
            setEmail(v);
            // 입력 시 이메일 관련 에러/체크 결과 리셋
            setErrors(prev => ({ ...prev, email: undefined }));
            setEmailCheckResult('');
            emit({ ...snapshot, email: v });
          }}
          onBlur={() => {
            // // 포커스 해제 시 1차 형식/ASCII 검증
            // const msg = validateEmailField(email);
            // setErrors(prev => ({ ...prev, email: msg || undefined }));
          }}
          error={errors.email}
          onCheck={handleEmailCheck}
          isChecking={emailChecking}
          checkResult={emailCheckResult}
        />

        <InputField
          id="pw"
          label="비밀번호"
          type="password"
          value={pw}
          onChange={v => {
            setPw(v);
            // 입력 중엔 비밀번호/확인 에러 해제
            setErrors(prev => ({ ...prev, pw: undefined, confirmPw: undefined }));
            emit({ ...snapshot, pw: v });
          }}
          onBlur={() => {
            // const msg = validatePasswordField(pw);
            // setErrors(prev => ({ ...prev, pw: msg || undefined }));
          }}
          error={errors.pw}
        />

        <InputField
          id="confirmPw"
          label="비밀번호 확인"
          type="password"
          value={confirmPw}
          onChange={v => {
            setConfirmPw(v);
            setErrors(prev => ({ ...prev, confirmPw: undefined }));
            emit({ ...snapshot, confirmPw: v });
          }}
          onBlur={() => {
            // const msg = validateConfirmPwField(confirmPw, pw);
            // setErrors(prev => ({ ...prev, confirmPw: msg || undefined }));
          }}
          error={errors.confirmPw}
        />

        <div>
          <InputField
            id="nickname"
            label="닉네임"
            value={nickname}
            onChange={v => {
              setNickname(v);
              setErrors(prev => ({ ...prev, nickname: undefined }));
              setNickCheckResult('');
              // 타이핑 중에도 감지만 업데이트(UX용)
              setNickLang(detectLang(v));
              emit({ ...snapshot, nickname: v });
            }}
            onBlur={async () => {
              // const { error, lang } = validateNicknameField(nickname);
              // setNickLang(lang);
              // if (error) {
              //   setErrors(prev => ({ ...prev, nickname: error }));
              //   return;
              // }
              // // 블러 시에도 서버 정책 검증을 가볍게 시도(있으면)
              // if (lang) {
              //   const policyErr = await serverNicknamePolicyError(nickname, lang);
              //   if (policyErr) {
              //     setErrors(prev => ({ ...prev, nickname: policyErr }));
              //   }
              // }
            }}
            error={errors.nickname}
            onCheck={handleNickCheck}
            isChecking={nickChecking}
            checkResult={nickCheckResult}
          />
          {/* 감지된 언어 힌트 */}
          {nickname && (
            <p className="text-[11px] text-gray-500 mt-1 ml-3">
              감지된 언어:{' '}
              <span className="font-medium">{langLabel(nickLang) || '알 수 없음'}</span>
              {nickLang ? ` · 길이 ${LEN[nickLang][0]}~${LEN[nickLang][1]}자, 언더바 최대 2개` : ''}
            </p>
          )}
        </div>

        <GenderSelect
          value={gender}
          onChange={v => {
            setGender(v);
            setErrors(prev => ({ ...prev, gender: undefined }));
            emit({ ...snapshot, gender: v });
          }}
          error={!!errors.gender}
        />

        <BirthInput
          value={birth}
          onChange={v => {
            setBirth(v);
            setErrors(prev => ({ ...prev, birth: undefined }));
            emit({ ...snapshot, birth: v });
          }}
          error={!!errors.birth}
        />

        <CountrySelect
          value={country}
          onChange={v => {
            setCountry(v);
            setErrors(prev => ({ ...prev, country: undefined }));
            emit({ ...snapshot, country: v });
          }}
          error={!!errors.country}
        />
      </div>

      <div className="flex justify-between sm:justify-end gap-2 sm:gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition-colors"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={emailChecking || nickChecking}
          className="bg-[var(--ara-primary)] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음 단계
        </button>
      </div>
    </section>
  );
}
