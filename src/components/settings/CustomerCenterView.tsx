interface CustomerCenterViewProps {
  onClose?: () => void;
}

export function CustomerCenterView({ onClose }: CustomerCenterViewProps) {
  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="px-4 md:px-6 py-4 md:py-6 overflow-auto bg-white dark:bg-secondary">
        <div className="max-w-3xl mx-auto space-y-5 text-sm md:text-[15px] leading-relaxed text-gray-800 dark:text-gray-100">
          <p className="text-xs md:text-[13px] text-gray-400 dark:text-gray-500">
            서비스 이용 중 어려움이 있다면 아래 채널로 언제든지 문의해주세요.
          </p>

          <section>
            <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
              이메일 문의
            </h4>
            <p>
              <span className="font-medium">koreara25@gmail.com</span>
              <br />
              평일 10:00 ~ 18:00 (주말/공휴일 휴무)
            </p>
          </section>

          <section>
            <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
              앱 내 신고/문의 (예정)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[13px] md:text-[14px]">
              <li>게시물 · 댓글 오른쪽 상단 메뉴에서 바로 신고할 수 있어요.</li>
              <li>DM 목록 &gt; 사용자 프로필 &gt; 신고/차단 메뉴에서도 제보 가능합니다.</li>
            </ul>
          </section>

          <section>
            <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
              자주 묻는 질문 (FAQ)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[13px] md:text-[14px]">
              <li>계정/비밀번호, 로그인 문제</li>
              <li>신고/차단 및 커뮤니티 가이드라인</li>
              <li>데이터/개인정보 관련 문의</li>
            </ul>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              정식 런칭 시, FAQ 페이지가 추가될 예정입니다.
            </p>
          </section>
        </div>
      </div>

      {onClose && (
        <div className="flex justify-end gap-2 px-4 md:px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 text-xs md:text-sm"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerCenterView;
