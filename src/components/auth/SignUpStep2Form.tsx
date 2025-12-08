import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import BirthInput from './BirthInput';
import CountrySelect from './CountrySelect';
import GenderSelect from './GenderSelect';
import InputField from './InputField';

const EMAIL_ASCII_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const NON_ASCII_RE = /[^\x00-\x7F]/;

function toYMDLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function validateEmailField(raw: string): string {
  const s = raw ?? '';
  if (!s.trim()) return '이메일을 입력해주세요.';
  if (/\s/.test(s)) return '이메일에 공백은 사용할 수 없습니다.';
  if (NON_ASCII_RE.test(s)) return '이메일은 영문/숫자로만 입력해주세요.';
  if (!EMAIL_ASCII_RE.test(s)) return '올바르지 않은 이메일 형식입니다.';
  if (s.length > 254) return '올바르지 않은 이메일 형식입니다.';
  const [local, domain] = s.split('@');
  if (!local || !domain) return '올바르지 않은 이메일 형식입니다.';
  if (local.length > 64) return '올바르지 않은 이메일 형식입니다.';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..'))
    return '올바르지 않은 이메일 형식입니다.';
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

/** 닉네임 유틸 */
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
  | 'pt-br'
  | 'de'
  | 'fi';

const RE = {
  ko: /^[가-힣0-9_]+$/,
  en: /^[A-Za-z0-9_]+$/,
  ja: /^[ぁ-ゟ゠-ヿｦ-ﾟ一-龯0-9_]+$/,
  zh: /^[\u4E00-\u9FFF0-9_]+$/,
  ru: /^[\u0400-\u04FF0-9_]+$/,
  vi: /^[A-Za-zÀ-ỹ0-9_]+$/,
  bn: /^[\u0980-\u09FF0-9_]+$/,
  ar: /^[\u0600-\u06FF0-9_]+$/,
  hi: /^[\u0900-\u097F0-9_]+$/,
  th: /^[\u0E00-\u0E7F0-9_]+$/,
  es: /^[A-Za-záéíóúñüÁÉÍÓÚÑÜ0-9_]+$/,
  fr: /^[A-Za-zàâçéèêëîïôùûüÀÂÇÉÈÊËÎÏÔÙÛÜ0-9_]+$/,
  pt: /^[A-Za-zãõçáéíóúÃÕÇÁÉÍÓÚ0-9_]+$/,
  'pt-br': /^[A-Za-záãâçéêíóôõúÁÃÂÇÉÊÍÓÔÕÚ0-9_]+$/,
  de: /^[A-Za-zÄÖÜäöüß0-9_]+$/,
  fi: /^[A-Za-zÅÄÖåäö0-9_]+$/,
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
  de: [3, 12],
  fi: [3, 12],
};

const DIACRITIC_HINT = {
  es: /[áéíóúñüÁÉÍÓÚÑÜ]/,
  fr: /[àâçéèêëîïôùûüÀÂÇÉÈÊËÎÏÔÙÛÜ]/,
  pt: /[ãõçáéíóúÃÕÇÁÉÍÓÚ]/,
  'pt-br': /[áãâçéêíóôõúÁÃÂÇÉÊÍÓÔÕÚ]/,
  vi: /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/,
  de: /[ÄÖÜäöüß]/,
  fi: /[ÅÄÖåäö]/,
};

function hasOnlyOneScript(nick: string): boolean {
  // 숫자 / 언더바는 스크립트 판정에서 제외 (어느 언어에도 공통으로 허용)
  const scripts = new Set<string>();

  const isLatinChar = (ch: string) =>
    /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/.test(
      ch,
    );

  for (const ch of nick) {
    if (/[0-9_]/.test(ch)) continue;

    if (/[가-힣]/.test(ch)) {
      scripts.add('hangul');
    } else if (/[ぁ-ゟ゠-ヿｦ-ﾟ]/.test(ch)) {
      scripts.add('kana');
    } else if (/[\u4E00-\u9FFF]/.test(ch)) {
      scripts.add('han');
    } else if (/[\u0400-\u04FF]/.test(ch)) {
      scripts.add('cyrillic');
    } else if (/[\u0600-\u06FF]/.test(ch)) {
      scripts.add('arabic');
    } else if (/[\u0900-\u097F]/.test(ch)) {
      scripts.add('devanagari'); // hi
    } else if (/[\u0E00-\u0E7F]/.test(ch)) {
      scripts.add('thai');
    } else if (/[\u0980-\u09FF]/.test(ch)) {
      scripts.add('bengali');
    } else if (isLatinChar(ch)) {
      scripts.add('latin');
    } else {
      scripts.add('other');
    }

    if (scripts.size > 1) return false;
  }

  return true;
}

function detectLang(nick: string): Lang | null {
  if (!nick) return null;
  const s = nick;

  // 1) 비 라틴 스크립트는 기존 로직 그대로
  if (/[가-힣]/.test(s)) return 'ko';
  if (/[ぁ-ゟ゠-ヿｦ-ﾟ]/.test(s)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(s)) return 'zh';
  if (/[\u0400-\u04FF]/.test(s)) return 'ru';
  if (/[\u0600-\u06FF]/.test(s)) return 'ar';
  if (/[\u0900-\u097F]/.test(s)) return 'hi';
  if (/[\u0E00-\u0E7F]/.test(s)) return 'th';
  if (/[\u0980-\u09FF]/.test(s)) return 'bn';

  // 라틴 계열 문자가 하나도 없으면 감지 불가
  const hasLatin = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/.test(s);
  if (!hasLatin) return null;

  // 악센트(다이아크리틱)가 하나도 없으면 → 영어로 취급
  const hasAnyDiacritic =
    DIACRITIC_HINT.es.test(s) ||
    DIACRITIC_HINT.fr.test(s) ||
    DIACRITIC_HINT.pt.test(s) ||
    DIACRITIC_HINT['pt-br'].test(s) ||
    DIACRITIC_HINT.vi.test(s) ||
    DIACRITIC_HINT.de.test(s) || // de / fi 힌트도 같이 사용
    DIACRITIC_HINT.fi.test(s);

  if (!hasAnyDiacritic) {
    return 'en';
  }

  // 라틴 계열 후보들 점수 계산
  //   - 기본 우선순위: es → pt-br → pt → fr → de → fi → vi
  const latinCandidates: Lang[] = ['es', 'pt-br', 'pt', 'fr', 'de', 'fi', 'vi'];

  let bestLang: Lang | null = null;
  let bestScore = -1;

  for (const lang of latinCandidates) {
    let score = 0;

    // 1) 해당 언어용 정규식에 맞으면 +1
    const re = RE[lang];
    if (re && re.test(s)) {
      score += 1;
    }

    // 2) 악센트 글자 개수 × 3점
    const hintRe = (DIACRITIC_HINT as any)[lang] as RegExp | undefined;
    if (hintRe) {
      const m = s.match(hintRe);
      if (m) {
        score += m.length * 3;
      }
    }

    // 3) 언어별 보정(heuristics)
    // 베트남어: 짧은 이름 + nh/ng 패턴은 가산점
    if (lang === 'vi') {
      const hasVNCore = /[ĂăÂâÊêÔôƠơƯưĐđ]/.test(s); // 전형적인 베트남어 글자
      const hasNhNg = /(nh|ng)/i.test(s);

      if (hasVNCore) {
        score += 4;
      }
      // 예: "Ánh" 같은 3~4자, nh/ng 포함 → 베트남어 쪽으로 강하게 밀어줌
      if (hasNhNg && s.length <= 4) {
        score += 2;
      }
    }

    // 🇪🇸 스페인어: 거의 쓰지 않는 'nh'가 있으면 약간 감점
    if (lang === 'es') {
      if (/nh/i.test(s)) {
        score -= 1;
      }
    }

    // 🇵🇹 포르투갈어: ã/õ/ç가 없고 nh도 없으면 살짝 감점
    if (lang === 'pt' || lang === 'pt-br') {
      const hasPtCore = /[ãÃõÕçÇ]/.test(s);
      if (!hasPtCore && !/nh/i.test(s)) {
        score -= 1;
      }
    }

    // 최고 점수 갱신
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  // 후보 중 점수 제일 높은 라틴 언어가 있으면 그걸 사용,
  // 그래도 없으면 영어로 fallback
  return bestLang ?? 'en';
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
  if (!hasOnlyOneScript(u))
    return { error: '닉네임은 하나의 문자계열만 사용할 수 있습니다.', lang: null };

  const lang = detectLang(u);
  if (!lang) return { error: '언어를 인식할 수 없습니다. 허용 문자만 사용해주세요.', lang: null };

  const [min, max] = LEN[lang];
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
    de: '독일어',
    fi: '핀란드어',
  };
  return map[l] ?? l;
}

// === 만 14세 이상 여부 판단 ===
function isAge14Plus(dateLike?: Date | string | null) {
  if (!dateLike) return false;
  const birth = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const notHadBirthday = today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (notHadBirthday) age -= 1;
  return age >= 14;
}

type Props = {
  onNext: (data: FormData) => void;
  onBack: () => void;
  value?: FormData;
  onChange?: (data: FormData) => void;
  verified: { email: { value: string; ok: boolean }; nickname: { value: string; ok: boolean } };
  submitAttempted: boolean;
  onInvalidateByChange: (email: string, nickname: string) => void;
  onDupChecked: (which: 'email' | 'nickname', value: string, ok: boolean) => void;
  signupKind: 'email' | 'social';
};

export type FormData = {
  email: string;
  pw: string;
  confirmPw: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  birthYmd?: string | null;
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
  signupKind,
}: Props) {
  const [email, setEmail] = useState(value?.email ?? '');
  const [pw, setPw] = useState(value?.pw ?? '');
  const [confirmPw, setConfirmPw] = useState(value?.confirmPw ?? '');
  const [nickname, setNickname] = useState(value?.nickname ?? '');
  const [gender, setGender] = useState(value?.gender ?? '');
  const [birth, setBirth] = useState<Date | null>(value?.birth ?? null);
  const [birthYmd, setBirthYmd] = useState<string | null>(
    value?.birth ? toYMDLocal(value.birth) : (value?.birthYmd ?? null),
  );
  const [country, setCountry] = useState(value?.country ?? '');
  const [nickLang, setNickLang] = useState<Lang | null>(null);

  useEffect(() => {
    if (!value) return;
    setEmail(value.email ?? '');
    setPw(value.pw ?? '');
    setConfirmPw(value.confirmPw ?? '');
    setNickname(value.nickname ?? '');
    setGender(value.gender ?? '');
    setBirth(value.birth ?? null);
    setBirthYmd(value.birth ? toYMDLocal(value.birth) : (value.birthYmd ?? null));
    setCountry(value.country ?? '');
  }, [value]);

  // 부모로 변경 통지
  const emit = (next: FormData) => onChange?.(next);

  // 소셜 모드: 이메일/비번 자동 세팅 & 비활성화
  useEffect(() => {
    if (signupKind !== 'social') return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const socialEmail = data.session?.user?.email ?? '';

      setEmail(socialEmail);
      setPw('__SOCIAL__');
      setConfirmPw('__SOCIAL__');

      setErrors(prev => ({ ...prev, email: undefined, pw: undefined, confirmPw: undefined }));
      setEmailCheckResult('available');
      onDupChecked('email', socialEmail, true);

      emit({
        email: socialEmail,
        pw: '__SOCIAL__',
        confirmPw: '__SOCIAL__',
        nickname,
        gender,
        birth,
        birthYmd,
        country,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signupKind]);

  // 값 변경시 중복검사 캐시 무효화 판단
  useEffect(() => {
    onInvalidateByChange(email, nickname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, nickname]);

  // 외부 캐시 → 로컬 표시 동기화
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

  // 제출 시도 → 전체 검증
  useEffect(() => {
    if (submitAttempted) validate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitAttempted]);

  const snapshot: FormData = useMemo(
    () => ({ email, pw, confirmPw, nickname, gender, birth, birthYmd, country }),
    [email, pw, confirmPw, nickname, gender, birth, birthYmd, country],
  );

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'taken' | ''>('');
  const [nickChecking, setNickChecking] = useState(false);
  const [nickCheckResult, setNickCheckResult] = useState<'available' | 'taken' | ''>('');

  const validate = (withDupHints = false): boolean => {
    const newErr: Partial<Record<keyof FormData, string>> = {};

    // 이메일/비번 검증은 이메일 가입에서만
    if (signupKind !== 'social') {
      const emailMsg = validateEmailField(email);
      if (emailMsg) newErr.email = emailMsg;

      const pwMsg = validatePasswordField(pw);
      if (pwMsg) newErr.pw = pwMsg;

      const confirmMsg =
        (confirmPw ?? '')
          ? confirmPw === pw
            ? ''
            : '비밀번호가 일치하지 않습니다.'
          : '비밀번호 확인을 입력해주세요.';
      if (confirmMsg) newErr.confirmPw = confirmMsg;
    }

    // 공통 검증
    const { error: nickMsg, lang } = validateNicknameField(nickname);
    setNickLang(lang);
    if (nickMsg) newErr.nickname = nickMsg;
    if (!gender) newErr.gender = '성별을 선택해주세요.';
    if (!birth) newErr.birth = '생년월일을 입력해주세요.';
    // [추가] 생일이 들어왔다면, 오늘 기준 만 14세 이상인지 체크
    if (birth && !isAge14Plus(birth)) {
      newErr.birth = '만 14세 미만은 가입할 수 없습니다.';
    }
    if (!country) newErr.country = '국적을 선택해주세요.';

    if (withDupHints) {
      // 이메일 중복 힌트는 이메일 가입에서만
      if (signupKind !== 'social') {
        const emailVerifiedOk = verified.email.ok && verified.email.value === email;
        if (!newErr.email && !emailVerifiedOk && emailCheckResult !== 'available') {
          newErr.email =
            emailCheckResult === 'taken'
              ? '해당 이메일은 이미 사용 중입니다.'
              : '이메일 중복확인을 진행해주세요.';
        }
      }
      // 닉네임 중복 힌트
      const nickVerifiedOk = verified.nickname.ok && verified.nickname.value === nickname;
      if (!newErr.nickname && !nickVerifiedOk && nickCheckResult !== 'available') {
        newErr.nickname =
          nickCheckResult === 'taken'
            ? '해당 닉네임은 이미 사용 중입니다.'
            : '닉네임 중복확인을 진행해주세요.';
      }
    }

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  // 서버 정책 검사
  async function serverNicknamePolicyError(nick: string, lang: Lang): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('validate_nickname_policy', {
        in_nick: nick,
        in_lang: lang,
      } as any);
      if (error) return null;
      return data ?? null;
    } catch {
      return null;
    }
  }

  // 이메일 중복 상태
  const emailDupStatus = async (): Promise<'available' | 'taken' | 'error'> => {
    if (signupKind === 'social') return 'available';
    const msg = validateEmailField(email);
    if (msg) {
      setErrors(prev => ({ ...prev, email: msg }));
      return 'error';
    }
    try {
      const { data, error } = await supabase.rpc('email_exists', { _email: email.trim() });
      if (error) return 'error';
      return data === true ? 'taken' : 'available';
    } catch {
      return 'error';
    }
  };

  // 닉네임 중복 상태
  const nickDupStatus = async (): Promise<'available' | 'taken' | 'error'> => {
    const { error: nickMsg, lang } = validateNicknameField(nickname);
    setNickLang(lang);

    // 형식/언어 감지 에러
    if (nickMsg || !lang) {
      setErrors(prev => ({ ...prev, nickname: nickMsg || '닉네임을 다시 확인해주세요.' }));
      return 'error';
    }

    try {
      // 1) 서버 정책 검사 (욕설/예약어 등)
      const policyErr = await serverNicknamePolicyError(nickname, lang);
      if (policyErr) {
        setErrors(prev => ({ ...prev, nickname: policyErr }));
        return 'error';
      }

      // 2) DB RPC로 중복 여부 확인 (정규화 기준)
      const { data, error } = await supabase.rpc('nickname_exists', {
        _nickname: nickname,
        _lang: lang,
      } as any);

      console.log('nickname_exists result:', { data, error });

      if (error) {
        console.error('nickname_exists rpc error', error);
        return 'error';
      }

      const exists = data === true;
      return exists ? 'taken' : 'available';
    } catch (e) {
      console.error('nickname dup check exception', e);
      return 'error';
    }
  };

  // 이메일 체크 버튼
  const handleEmailCheck = async () => {
    const res = await emailDupStatus();
    if (res === 'taken') {
      setEmailCheckResult('taken');
      setErrors(prev => ({ ...prev, email: '해당 이메일은 이미 사용 중입니다.' }));
    } else if (res === 'available') {
      setEmailCheckResult('available');
      setErrors(prev => ({ ...prev, email: undefined }));
      onDupChecked('email', email, true);
    } else {
      setEmailCheckResult('');
    }
  };

  // 닉네임 체크 버튼
  const handleNickCheck = async () => {
    const res = await nickDupStatus();
    if (res === 'taken') {
      setNickCheckResult('taken');
      setErrors(prev => ({ ...prev, nickname: '해당 닉네임은 이미 사용 중입니다.' }));
    } else if (res === 'available') {
      setNickCheckResult('available');
      setErrors(prev => ({ ...prev, nickname: undefined }));
      onDupChecked('nickname', nickname, true);
    } else {
      setNickCheckResult('');
    }
  };

  const handleNext = async () => {
    if (!validate(true)) return;

    const cachedEmailOK =
      signupKind === 'social' ? true : verified.email.ok && verified.email.value === email;
    const cachedNickOK = verified.nickname.ok && verified.nickname.value === nickname;

    if (cachedEmailOK && cachedNickOK) {
      onNext(snapshot);
      return;
    }

    setEmailChecking(signupKind !== 'social');
    setNickChecking(true);
    try {
      const [eRes, nRes] = await Promise.all([
        signupKind === 'social' ? Promise.resolve<'available'>('available') : emailDupStatus(),
        nickDupStatus(),
      ]);

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

      if (signupKind !== 'social') onDupChecked('email', email, true);
      onDupChecked('nickname', nickname, true);
      onNext(snapshot);
    } finally {
      setEmailChecking(false);
      setNickChecking(false);
    }
  };

  return (
    <section className="bg-white p-4 sm:p-6 md:p-8 shadow dark:bg-secondary">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5 dark:text-gray-100">
        회원 정보 입력
      </h2>

      <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
        <InputField
          id="email"
          label="이메일"
          value={email}
          onChange={v => {
            if (signupKind === 'social') return; // 소셜은 고정
            setEmail(v);
            setErrors(prev => ({ ...prev, email: undefined }));
            setEmailCheckResult('');
            emit({ ...snapshot, email: v });
          }}
          error={errors.email}
          isChecking={emailChecking}
          checkResult={signupKind === 'social' ? '' : emailCheckResult}
          onCheck={signupKind === 'social' ? undefined : handleEmailCheck}
          className={signupKind === 'social' ? 'opacity-70 cursor-not-allowed' : ''}
          inputProps={
            signupKind === 'social'
              ? {
                  readOnly: true,
                  tabIndex: -1, // 탭 포커스 차단
                  onFocus: e => e.currentTarget.blur(), // 포커스 들어와도 즉시 해제
                  onMouseDown: e => e.preventDefault(), // 마우스 포커스 차단
                  onKeyDown: e => e.preventDefault(), // 키입력 방지
                  // 크기 유지: 클래스는 안 건드리고 색상만 인라인 스타일로
                  style: {
                    backgroundColor: 'rgb(243 244 246)', // bg-gray-100
                    color: 'rgb(107 114 128)', // text-gray-500
                    // 필요하면 포커스 테두리만 제거(크기 영향 없음)
                    outline: 'none',
                    cursor: 'default',
                  },
                }
              : undefined
          }
        />

        <InputField
          id="pw"
          label="비밀번호"
          type="password"
          value={pw}
          onChange={v => {
            if (signupKind === 'social') return;
            setPw(v);
            setErrors(prev => ({ ...prev, pw: undefined, confirmPw: undefined }));
            emit({ ...snapshot, pw: v });
          }}
          error={errors.pw}
          inputProps={
            signupKind === 'social'
              ? {
                  readOnly: true,
                  tabIndex: -1, // 탭 포커스 차단
                  onFocus: e => e.currentTarget.blur(), // 포커스 들어와도 즉시 해제
                  onMouseDown: e => e.preventDefault(), // 마우스 포커스 차단
                  onKeyDown: e => e.preventDefault(), // 키입력 방지
                  // 크기 유지: 클래스는 안 건드리고 색상만 인라인 스타일로
                  style: {
                    backgroundColor: 'rgb(243 244 246)', // bg-gray-100
                    color: 'rgb(107 114 128)', // text-gray-500
                    // 필요하면 포커스 테두리만 제거(크기 영향 없음)
                    outline: 'none',
                    cursor: 'default',
                  },
                }
              : undefined
          }
        />

        <InputField
          id="confirmPw"
          label="비밀번호 확인"
          type="password"
          value={confirmPw}
          onChange={v => {
            if (signupKind === 'social') return;
            setConfirmPw(v);
            setErrors(prev => ({ ...prev, confirmPw: undefined }));
            emit({ ...snapshot, confirmPw: v });
          }}
          error={errors.confirmPw}
          inputProps={
            signupKind === 'social'
              ? {
                  readOnly: true,
                  tabIndex: -1, // 탭 포커스 차단
                  onFocus: e => e.currentTarget.blur(), // 포커스 들어와도 즉시 해제
                  onMouseDown: e => e.preventDefault(), // 마우스 포커스 차단
                  onKeyDown: e => e.preventDefault(), // 키입력 방지
                  // 크기 유지: 클래스는 안 건드리고 색상만 인라인 스타일로
                  style: {
                    backgroundColor: 'rgb(243 244 246)', // bg-gray-100
                    color: 'rgb(107 114 128)', // text-gray-500
                    // 필요하면 포커스 테두리만 제거(크기 영향 없음)
                    outline: 'none',
                    cursor: 'default',
                  },
                }
              : undefined
          }
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
              setNickLang(detectLang(v));
              emit({ ...snapshot, nickname: v });
            }}
            error={errors.nickname}
            onCheck={handleNickCheck}
            isChecking={nickChecking}
            checkResult={nickCheckResult}
          />
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
            const ymd = v ? toYMDLocal(v) : null;
            setBirthYmd(ymd);
            setErrors(prev => ({ ...prev, birth: undefined }));
            emit({ ...snapshot, birth: v, birthYmd: ymd });
          }}
          error={!!errors.birth}
          errorMessage={errors.birth}
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
          className="bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition-colors dark:bg-neutral-500 dark:text-gray-100"
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
