import { useCallback } from 'react';
import type { ConsentResult } from '@/types/consent';
import { readConsentDraft, saveConsentDraft } from '@/services/consentService';

export function useConsentDraft() {
  const load = useCallback(() => readConsentDraft(), []);

  const persist = useCallback((c: ConsentResult) => {
    saveConsentDraft({
      tos_agreed: c.terms,
      privacy_agreed: c.privacy,
      marketing_agreed: c.marketing,
      age_ok: c.age,
    });
  }, []);

  return { load, persist };
}