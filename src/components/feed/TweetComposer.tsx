import { useEffect, useRef, useState } from 'react';

interface TweetComposerProps {
  onPost: (content: string) => void;
}

const TweetComposer = () => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textarea 자동 높이 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content]);

  const handlePost = () => {
    if (!content.trim()) return;
    console.log('🚀 Post submitted:', content);
    setContent('');
  };
  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex space-x-3">
        {/* 프로필 이미지 */}
        <img
          src="https://picsum.photos/80"
          alt="Your avatar"
          className="w-12 h-12 rounded-full object-cover"
        />

        {/* 입력 영역 */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What is happening?!"
            rows={3}
            className="w-full text-xl placeholder-gray-500 border-none resize-none outline-none bg-transparent"
          />

          {/* 아이콘 + 버튼 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-4 text-primary">
              {[
                'ri-image-line',
                'ri-file-gif-line',
                'ri-bar-chart-horizontal-line',
                'ri-emotion-line',
                'ri-calendar-event-line',
              ].map((icon, i) => (
                <button key={i} className="hover:bg-blue-50 p-2 rounded-full transition">
                  <i className={`${icon} text-lg`} />
                </button>
              ))}
            </div>
            <button
              disabled={!content.trim()}
              onClick={handlePost}
              className={`font-bold py-2 px-6 rounded-button text-white transition-colors ${
                content.trim()
                  ? 'bg-primary hover:bg-blue-600'
                  : 'bg-primary opacity-50 cursor-not-allowed'
              }`}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetComposer;
