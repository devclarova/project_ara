// src/components/detail/ReplyComposer.tsx
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import FFFBox from '@/pages/temps/FFFBox'
import { useEffect, useState } from 'react'

interface ReplyComposerProps {
  parentId: string
  onReply?: (parentId: string, content: string) => void
}

/**
 * ✅ ReplyComposer — FFFBox를 활용한 댓글 작성 버전
 * 댓글은 tweet_replies 테이블에 저장됨
 */
export default function ReplyComposer({ parentId, onReply }: ReplyComposerProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)

  // ✅ 프로필 데이터 불러오기
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data)
      })
  }, [user])

  // ✅ 댓글 등록 함수
  const handleAddReply = async (newReply: any) => {
    if (!user) return alert('로그인이 필요합니다.')

    const { data, error } = await supabase
      .from('tweet_replies')
      .insert([
        {
          tweet_id: parentId,
          author_id: profile?.id,
          content: newReply.content, // FFFTweetComposer의 내용
        },
      ])
      .select(
        `
        id,
        content,
        created_at,
        profiles:author_id (
          nickname,
          avatar_url
        )
      `,
      )
      .single()

    if (error) {
      console.error('❌ 댓글 등록 실패:', error)
      return
    }

    // ✅ 부모 컴포넌트에 알림
    onReply?.(parentId, newReply.content)
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      <FFFBox
        profile={profile}
        onPost={handleAddReply}
      />
    </div>
  )
}
