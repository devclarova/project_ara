// src/components/detail/TweetMain.tsx
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Avatar from '../common/Avatar'
import type { Tweet } from '../../data/mockTweet'

interface TweetMainProps {
  tweet: Tweet
}

const TweetMain = ({ tweet }: TweetMainProps) => {
  const { author, handle, avatar, content, image, created_at } = tweet

  // 날짜 포맷
  const formattedTime = format(new Date(created_at), 'a h:mm', { locale: ko })
  const formattedDate = format(new Date(created_at), 'yyyy년 M월 d일', {
    locale: ko,
  })

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
            <img
              src={image}
              alt="tweet image"
              className="rounded-2xl w-full object-cover mb-4"
            />
          )}

          {/* 시간/날짜 */}
          <div className="text-secondary text-base mb-6">
            {formattedTime} · {formattedDate}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TweetMain
