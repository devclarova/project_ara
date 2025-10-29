import Button from '@/components/common/Buttons';

function SNSConnect({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">연결할 SNS를 선택하세요</p>
        <div className="mt-4 space-y-2 flex flex-col gap-4">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-solid border-gray-300 rounded-lg py-2 sm:py-3 text-sm sm:text-base font-medium text-black bg-[#fff] hover:bg-gray-50 transition-opacity"
          >
            <img src="/images/google_logo.png" alt="Sign in with Google" className="w-5 h-5" />
            <span>Google 연결</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 sm:py-3 text-sm sm:text-base font-medium text-black bg-[#FEE500] hover:opacity-80 transition-opacity"
          >
            <img src="/images/kakao_logo.png" alt="Sign in with Google" className="w-5 h-5" />
            <span>카카오 연결</span>
          </button>
        </div>
      </div>
      <div className="-mx-6 mt-auto dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="primary" size="md" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}

export default SNSConnect;
