// src/components/detail/TweetMain.tsx
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Avatar from '../common/Avatar'
import DOMPurify from 'dompurify' // ✅ 추가

interface TweetMainProps {
  tweet: {
    id: string
    author: string
    avatar: string
    content: string
    image?: string | null
    created_at: string
  }
}

const TweetMain = ({ tweet }: TweetMainProps) => {
  const { author, avatar, content, image, created_at } = tweet

  const formattedTime = format(new Date(created_at), 'a h:mm', { locale: ko })
  const formattedDate = format(new Date(created_at), 'yyyy년 M월 d일', {
    locale: ko,
  })

  return (
    <section className="p-6 border-b border-gray-200">
      <div className="flex space-x-4">
        {/* 프로필 이미지 */}
        <Avatar src={avatar} alt={author} size={56} />

        <div className="flex-1">
          {/* 작성자 */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="font-bold text-lg">{author}</span>
          </div>

          {/* ✅ Quill content HTML 렌더링 */}
          <div
            className="text-xl leading-relaxed mb-4 text-gray-900 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />

          {/* 대표 이미지 (옵션) */}
          {image && (
            <img
              src={image}
              alt="tweet image"
              className="rounded-2xl w-full object-cover mb-4"
            />
          )}

          {/* 작성 시간 */}
          <div className="text-secondary text-base mb-6">
            {formattedTime} · {formattedDate}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TweetMain
