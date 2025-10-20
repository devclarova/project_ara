// 헤더 (제목/새 채팅 버튼)

type DMHeaderProps = {
  onNewChatClick: () => void;
};

function DMHeader({ onNewChatClick }: DMHeaderProps) {
  return (
    <div className="p-4 border-b border-[#e0e0e0] flex justify-between items-center bg-white">
      <h2 className="m-0 text-[20px] font-semibold text-black">1:1 채팅</h2>
      <button
        onClick={onNewChatClick}
        className="bg-primary text-white border-0 px-5 py-2.5 rounded-full cursor-pointer text-sm font-medium opacity-80 transition-all duration-200 ease-in-out hover:opacity-100"
      >
        새 채팅
      </button>
    </div>
  );
}

export default DMHeader;
