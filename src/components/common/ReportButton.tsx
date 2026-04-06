/**
 * 신고 프로시저 진입 유닛(Reporting Procedure Entry Unit):
 * - 목적(Why): 부적절한 콘텐츠나 사용자를 관리자에게 알릴 수 있는 표준화된 신고 경로를 제공함
 * - 방법(How): 드롭다운 메뉴 내에서 이벤트 전파를 차단(stopPropagation)하며 신고 모달 호출 콜백을 안전하게 실행함
 */
import { useTranslation } from 'react-i18next';

interface ReportButtonProps {
  onClick: () => void;
}

export default function ReportButton({ onClick }: ReportButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={(e) => {
        // Event Propagation Control: Prevents click bubbling to parent containers while dispatching the reporting intent.
        e.stopPropagation();
        onClick();
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 
        dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm"
    >
      <i className="ri-flag-line" />
      {t('common.report')}
    </button>
  );
}
