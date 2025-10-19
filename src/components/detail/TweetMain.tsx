import React from 'react';
import Avatar from '../common/Avatar';
interface TweetMainProps {
  tweet: {
    author: string;
    handle: string;
    avatar: string;
    content: string;
    image?: string;
    time?: string;
    date?: string;
    views?: string;
  };
}

const TweetMain = ({ tweet }: TweetMainProps) => {
  const { author, handle, avatar, content, image, time, date, views } = tweet;
  return (
    <section className="p-6 border-b border-gray-200">
      <div className="flex space-x-4">
        {/* 프로필 이미지 */}
        <Avatar src={avatar} alt={author} size={56} />

        {/* 본문 영역 */}
        <div className="flex-1">
          {/* 작성자 */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="font-bold text-lg">{author}</span>
            <span className="text-secondary text-base">@{handle}</span>
          </div>

          {/* 본문 내용 */}
          <p className="text-xl leading-relaxed mb-4 text-gray-900 whitespace-pre-line">
            {content}
          </p>

          {/* 이미지 (선택적) */}
          {image && (
            <img src={image} alt="tweet image" className="rounded-2xl w-full object-cover mb-4" />
          )}

          {/* 시간/날짜/조회수 */}
          <div className="text-secondary text-base mb-6">
            {time || '2:34 PM'} · {date || 'Oct 17, 2024'} · {views || '1.2M Views'}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TweetMain;
