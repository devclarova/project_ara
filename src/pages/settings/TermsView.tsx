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
      <div className="-mx-6 mt-auto border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="primary" size="md" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}
