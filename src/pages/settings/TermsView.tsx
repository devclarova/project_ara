/**
 * 서비스 이용약관 요약 및 법적 고지 뷰(Service Terms of Use & Legal Notice View):
 * - 목적(Why): 사용자가 서비스 이용과 관련된 권리, 의무, 책임 및 분쟁 해결 절차를 명확히 인지하도록 정보를 제공함
 * - 방법(How): 서비스 제공, 회원가입, 금지행위 등 핵심 약관 항목을 체계적으로 분류하여 텍스트 기반의 구조화된 뷰를 렌더링함
 */
// 이용약관

import Button from '@/components/common/Buttons';

export function TermsView({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-3 text-sm leading-6 text-gray-700">
        <p>
          본 약관은 서비스의 이용과 관련하여 회사와 사용자 간의 권리·의무 및 책임사항, 절차 등을
          규정합니다.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스 제공, 변경 및 중단에 관한 사항</li>
          <li>회원가입, 계정, 보안에 관한 사항</li>
          <li>이용자의 권리와 의무, 금지행위</li>
          <li>분쟁 해결 및 관할 법원</li>
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
