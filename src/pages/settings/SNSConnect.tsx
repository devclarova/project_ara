import Button from '@/components/common/Buttons';

interface SNSConnectProps {
  onClose?: () => void;
}

function SNSConnect({ onClose }: SNSConnectProps) {
  return (
    <div className="flex flex-col h-full">
      {/* 내용 */}
      <div className="flex-1 min-h-0 px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5 bg-white dark:bg-secondary">
        <div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            계정을 소셜 로그인과 연결해 두면 로그인 및 복구가 더 편리해집니다.
          </p>
        </div>

        <div className="mt-2 space-y-3">
          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-xl
                       border border-gray-300 dark:border-gray-100
                       bg-white dark:bg-gray-500
                       py-2.5 md:py-3
                       text-sm md:text-base font-medium
                       text-gray-900 dark:text-gray-100
                       hover:bg-gray-50 dark:hover:bg-gray-600
                       transition-colors"
          >
            <img src="/images/google_logo.png" alt="Google" className="w-5 h-5" />
            <span>Google 계정 연결</span>
          </button>

          {/* Kakao */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-xl
                       border border-gray-300 dark:border-gray-600
                       bg-[#FEE500] dark:bg-[#FEE500]
                       py-2.5 md:py-3
                       text-sm md:text-base font-medium
                       text-gray-900
                       hover:brightness-75 transition"
          >
            <img src="/images/kakao_logo.png" alt="Kakao" className="w-5 h-5" />
            <span>카카오 계정 연결</span>
          </button>
        </div>

        <p className="text-[11px] md:text-xs text-gray-400 dark:text-gray-500">
          연결 계정은 설정 &gt; 개인정보 설정에서 언제든지 해제할 수 있습니다. (추후 제공 예정)
        </p>
      </div>

      {/* 푸터 */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary px-4 md:px-6 py-3.5 md:py-4 flex justify-end">
        <Button type="button" variant="primary" size="md" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}

export default SNSConnect;
