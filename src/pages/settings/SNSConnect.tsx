import Button from '@/components/common/Buttons';

function SNSConnect({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">연결할 SNS를 선택하세요</p>
        <div className="gap-2">
          <button className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
            Google 연결
          </button>
          <button className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
            Kakao 연결
          </button>
        </div>
      </div>
      <div className="-mx-6 mt-auto border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-end gap-2 transition-colors">
        <Button type="button" variant="primary" size="md" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}

export default SNSConnect;
