import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '@/hooks/useNicknameValidator';
import InputField, { type InputFieldProps } from '@/components/auth/InputField';

// This helper is duplicated from SignUpStep2Form.tsx to be self-contained in this display component
function useLangLabel() {
  const { t } = useTranslation();
  return (l?: Lang | null): string => {
    if (!l) return '';
    const map: Record<Lang, string> = {
      ko: t('signup.lang_korean'),
      en: t('signup.lang_english'),
      ja: t('signup.lang_japanese'),
      zh: t('signup.lang_chinese'),
      ru: t('signup.lang_russian'),
      vi: t('signup.lang_vietnamese'),
      bn: t('signup.lang_bengali'),
      ar: t('signup.lang_arabic'),
      hi: t('signup.lang_hindi'),
      th: t('signup.lang_thai'),
      es: t('signup.lang_spanish'),
      fr: t('signup.lang_french'),
      pt: t('signup.lang_portuguese'),
      'pt-br': t('signup.lang_portuguese_brazil'),
      de: t('signup.lang_german'),
      fi: t('signup.lang_finnish'),
    };
    return map[l] ?? l;
  };
}

interface NicknameInputFieldProps extends Omit<InputFieldProps, 'value' | 'onChange' | 'onCheck' | 'checkResult' | 'id' | 'label'> {
  value: string;
  onChange: (value: string) => void;
  onCheck: () => void;
  isChecking: boolean;
  checkResult: 'available' | 'taken' | 'error' | '';
  error?: string;
  detectedLang: Lang | null;
  minLen: number;
  maxLen: number;
  // Optional overrides
  id?: string;
  label?: string;
}

export default function NicknameInputField({
  value,
  onChange,
  onCheck,
  isChecking,
  checkResult,
  error,
  detectedLang,
  minLen,
  maxLen,
  id = 'nickname',
  label, // Defaulted inside component using t()
  ...inputFieldProps
}: NicknameInputFieldProps) {
  const { t } = useTranslation();
  const langLabel = useLangLabel();

  return (
    <div>
      <InputField
        id={id}
        label={label ?? t('signup.label_nickname')}
        value={value}
        onChange={onChange}
        error={error}
        onCheck={onCheck}
        isChecking={isChecking}
        checkResult={checkResult === 'error' ? '' : checkResult}
        {...inputFieldProps}
      />
      {value && (
        <p className="text-[11px] xs:text-[10.5px] text-gray-500 mt-1 ml-3">
          {t('signup.nickname_detected_lang')}{' '}
          <span className="font-medium">{langLabel(detectedLang) || t('signup.nickname_lang_unknown')}</span>
          {detectedLang ? ` · ${t('signup.nickname_hint', { min: minLen, max: maxLen })}` : ''}
        </p>
      )}
    </div>
  );
}
