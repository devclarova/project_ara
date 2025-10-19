import { FileVideo, Image, Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Avatar from '../common/Avatar';

const ReplyComposer = () => {
  const [reply, setReply] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textarea 자동 높이 조정
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [reply]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    console.log('Reply posted:', reply);
    setReply(''); // 입력 초기화
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 bg-white flex space-x-3">
      {/* 프로필 이미지 */}
      <Avatar
        src="https://api.dicebear.com/7.x/avataaars/svg?seed=you"
        alt="Your avatar"
        size={48}
      />

      {/* 입력 영역 */}
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          placeholder="Post your reply"
          value={reply}
          onChange={e => setReply(e.target.value)}
          rows={1}
          className="w-full text-xl placeholder-gray-500 border-none resize-none outline-none bg-transparent"
        />

        {/* 툴바 + 버튼 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-4 text-primary">
            <button type="button" className="hover:bg-blue-50 p-2 rounded-full transition-colors">
              <Image className="w-5 h-5" />
            </button>
            <button type="button" className="hover:bg-blue-50 p-2 rounded-full transition-colors">
              <FileVideo className="w-5 h-5" />
            </button>
            <button type="button" className="hover:bg-blue-50 p-2 rounded-full transition-colors">
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!reply.trim()}
            className={`font-bold py-2 px-6 rounded-[8px] text-white transition-colors ${
              reply.trim() ? 'bg-primary hover:bg-blue-600' : 'bg-primary/50 cursor-not-allowed'
            }`}
          >
            Reply
          </button>
        </div>
      </div>
    </form>
  );
};

export default ReplyComposer;
