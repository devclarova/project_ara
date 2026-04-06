/**
 * 서비스 개인정보 처리방침 요약 뷰(Privacy Policy Summary View):
 * - 목적(Why): 사용자가 자신의 데이터가 어떻게 수집, 이용, 파기되는지에 대한 법적 고지 사항을 투명하게 확인하도록 함
 * - 방법(How): 수집 항목, 보유 기간, 이용자 권리 등 핵심 항목을 리스트 화하여 가독성을 높이고 모달 프레임 내에서 정보를 구조화함
 */
import Button from '@/components/common/Buttons';

// 개인정보처리방침
export function PrivacyPolicyView({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-3 text-sm leading-6 text-gray-700">
        <p>
          회사는 서비스 제공을 위해 최소한의 개인정보를 수집·이용하며, 수집 목적 달성 후 지체 없이
          파기합니다.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>수집 항목, 수집·이용 목적, 보유·이용 기간</li>
          <li>개인정보 제3자 제공 및 처리위탁 현황</li>
          <li>이용자 권리(열람, 정정, 삭제, 처리정지)와 행사 방법</li>
          <li>개인정보 보호책임자 및 연락처</li>
        </ul>
      </div>
      <div className="-mx-6 mt-auto dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="primary" size="md" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}
