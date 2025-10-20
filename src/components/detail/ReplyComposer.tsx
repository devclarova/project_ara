// src/components/detail/ReplyComposer.tsx
import { useEffect, useRef, useState } from 'react'
import { Image, FileVideo, Smile } from 'lucide-react'
import Avatar from '../common/Avatar'
import { supabase } from '../../lib/supabase'

interface ReplyComposerProps {
  parentId: string
  onReply?: (parentId: string, content: string) => void
}

const ReplyComposer = ({ parentId, onReply }: ReplyComposerProps) => {
  const [reply, setReply] = useState<string>('') // 초기값 문자열 보장
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ✅ 로그인된 유저의 프로필 이미지 가져오기
  useEffect(() => {
    const fetchAvatar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('❌ Error fetching avatar:', error)
      }

      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      else setAvatarUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=You')
    }

    fetchAvatar()
  }, [])

  // textarea 높이 자동 조절
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [reply])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const content = reply.trim()
    if (!content) return

    console.group('%c💬 ReplyComposer Debug', 'color:#1d9bf0;font-weight:bold;')
    console.log('↳ parentId:', parentId)
    console.log('↳ reply value:', reply)
    console.groupEnd()

    onReply?.(parentId, content)
    setReply('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 border-b border-gray-200 bg-white flex space-x-3"
    >
      {/* ✅ Supabase 아바타 반영 */}
      <Avatar
        src={avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=You'}
        alt="Your avatar"
        size={48}
      />

      <div className="flex-1">
        <textarea
          ref={textareaRef}
          placeholder="Post your reply"
          value={reply || ''}
          onChange={(e) => setReply(String(e.target.value ?? ''))}
          rows={1}
          className="w-full text-lg placeholder-gray-500 border-none resize-none outline-none bg-transparent"
        />

        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-3 text-primary">
            {[Image, FileVideo, Smile].map((Icon, i) => (
              <button
                type="button"
                key={i}
                className="hover:bg-blue-50 p-2 rounded-full transition-colors"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!reply.trim()}
            className={`font-bold py-2 px-6 rounded-full text-white transition-colors ${
              reply.trim()
                ? 'bg-primary hover:bg-blue-600'
                : 'bg-primary/50 cursor-not-allowed'
            }`}
          >
            Reply
          </button>
        </div>
      </div>
    </form>
  )
}

export default ReplyComposer
