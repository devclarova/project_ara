/**
 * 서비스 이용약관 요약 및 법적 고지 뷰(Service Terms of Use & Legal Notice View):
 * - 목적(Why): 사용자가 서비스 이용과 관련된 권리, 의무, 책임 및 분쟁 해결 절차를 명확히 인지하도록 정보를 제공함
 * - 방법(How): 서비스 제공, 회원가입, 금지행위 등 핵심 약관 항목을 체계적으로 분류하여 텍스트 기반의 구조화된 뷰를 렌더링함
 */
import Button from '@/components/common/Buttons';
import { useTranslation } from 'react-i18next';

export function TermsView({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-6 text-sm leading-6 text-gray-700 dark:text-gray-300 overflow-y-auto pr-2">
        {/* 제1조 목적 */}
        <section>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t('policy.terms.purpose.h')}</h4>
          <p>{t('policy.terms.purpose.body')}</p>
        </section>

        {/* 제2조 정의 */}
        <section>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t('policy.terms.definition.h')}</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.definition.member')}</li>
            <li>{t('policy.terms.definition.content')}</li>
            <li>{t('policy.terms.definition.paid_service')}</li>
          </ul>
        </section>

        {/* 제3조 자격 */}
        <section>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t('policy.terms.contract.h')}</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.contract.agreement')}</li>
            <li>{t('policy.terms.contract.verification')}</li>
            <li>{t('policy.terms.contract.age_limit')}</li>
          </ul>
        </section>

        {/* 제4조 금지행위 */}
        <section>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t('policy.terms.community.h')}</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('policy.terms.community.guidelines')}</li>
            <li>{t('policy.terms.community.prohibited_content')}</li>
            <li>{t('policy.terms.community.prohibited_actions')}</li>
            <li>{t('policy.terms.community.violations')}</li>
          </ul>
        </section>

        <p className="text-xs text-gray-400 mt-4 italic">
          * {t('policy.terms.more_detail_hint', '상세 약관은 정식 서비스 런칭 시 추가 고지될 예정입니다.')}
        </p>
      </div>
      <div className="-mx-6 mt-auto border-t dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="primary" size="md" onClick={onClose}>
          {t('common.close', '닫기')}
        </Button>
      </div>
    </div>
  );
}

export default TermsView;
