// 고객센터

export function CustomerCenterView() {
  return (
    <div className="space-y-3 text-sm leading-6 text-gray-700">
      <div className="rounded-xl border border-gray-100 p-3">
        <p className="font-medium text-gray-900">자주 묻는 질문(FAQ)</p>
        <p className="text-gray-600">계정, 결제, 보안 등 주요 질문을 확인하세요.</p>
        {/* 실제 라우터/링크로 교체 */}
        <button className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline">
          자세히 보기
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 p-3">
        <p className="font-medium text-gray-900">1:1 문의</p>
        <p className="text-gray-600">평일 09:00~18:00 (공휴일 제외)</p>
        <p className="text-gray-600">koreara25@gmail.com / 1234-5678</p>
      </div>
    </div>
  );
}
