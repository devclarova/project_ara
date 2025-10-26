// 지원 및 정책 페이지

export default function SupportPolicy() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">지원 및 정책</h3>

      <div className="space-y-2">
        <Row label="이용약관" />
        <Row label="개인정보처리방침" />
        <Row label="마케팅 정보 수신" />
        <Row label="고객센터" />
      </div>

      <p className="mt-8 text-[11px] text-gray-400 text-right">문의: koreara25@gmail.com</p>
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
