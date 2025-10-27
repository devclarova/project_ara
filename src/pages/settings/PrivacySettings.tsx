// 개인정보 설정 페이지

export default function PrivacySettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">개인정보 설정</h3>

      <div className="space-y-2">
        <Row label="비밀번호 변경" />
        <Row label="로그인활동 보기" />
        <Row label="SNS 계정 연결" />
        <Row label="언어선택" />
      </div>

      <p className="mt-8 text-[11px] text-gray-400 text-right">탈퇴하기</p>
    </div>
  );
}

function Row({ label }: { label: string }) {
  return (
    <button className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm transition text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-700">
      <span className="text-sm text-gray-900">{label}</span>
      <span className="text-gray-400">›</span>
    </button>
  );
}
