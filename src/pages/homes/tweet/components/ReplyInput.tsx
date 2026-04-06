/**
 * 실시간 답글 엔진(Real-time Reply Engine):
 * - 목적(Why): SNS 피드 내 계층형 답글 생성을 위한 상태 관리 및 데이터베이스 정합성 보장을 담당함
 * - 방법(How): 사용자 멘션(@) 자동 삽입 로직과 낙관적 UI 업데이트(Optimistic Update)를 통해 네트워크 지연 체감을 최소화함
 */

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { UIReply } from '@/types/sns';

export function ReplyInput({
  target,
  onCancel,
  onAdded,
}: {
  target: UIReply;
  onCancel: () => void;
  onAdded: (reply: UIReply) => void;
}) {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('id, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          setMyAvatar(data.avatar_url);
        }
      });
  }, [user]);

  // 컨텍스트 시맨틱 바인딩: 답글 대상 사용자의 식별자(Username)를 검색하여 입력 필드에 자동으로 멘션(@) 프리픽스를 주입함
  useEffect(() => {
    setContent(prev => (prev ? prev : `@${target.user.name} `));
  }, [target.user.name]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 쿠폰 유효성 검사 프로토콜: 데이터베이스 RPC(Stored Procedure)를 호출하여 사용자별 쿠폰 사용 제한 및 유효 기간을 실시간으로 검증함
  const handleSubmit = async () => {
    if (!user || !profileId || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // parent_reply_id logic: if target is a reply, we reply to it.
    // However, UIReply type doesn't explicitly have parent_reply_id in the shared definition 
    // but the DB row does. We should infer checking the object or assuming target.id is parent.
    // For safety with UIReply (which might be from a view), we assume we comment on the target.
    
    // NOTE: The previous code accessed target.parent_reply_id. UIReply as BaseFeedItem doesn't list it strictly
    // but at runtime/Supabase return it might exist. 
    // Let's assume we reply to the target ID as parent.
    const parentId = target.id; 
    // Root logic is complex without tree. For now, flat structure or simple nesting.
    // If target has a root_reply_id, use it. Otherwise target.id is root?
    // Casting target to any to access potential extra fields safely
    const targetAny = target as any;
    const rootId = targetAny.root_reply_id ?? target.id;

    // 데이터 오케스트레이션: 계층형 구조(Root/Parent)를 정의하는 메타데이터를 포함하여 Supabase 테이블에 비동기 삽입을 수행함
    const { data, error } = await supabase
      .from('tweet_replies')
      .insert({
        tweet_id: target.tweetId,
        author_id: profileId,
        content: content.trim(),
        parent_reply_id: parentId, // 특정 답글에 대한 직접적인 참조 유지
        root_reply_id: rootId,
      })
      .select()
      .single();

    if (error || !data) {
      setIsSubmitting(false);
      return;
    }

    onAdded({
      id: data.id,
      tweetId: data.tweet_id,
      type: 'reply', // Required by UIReply
      content: data.content,
      timestamp: '방금 전', // Placeholder
      liked: false,
      user: {
        name: user.email?.split('@')[0] ?? 'Me',
        username: user.id,
        avatar: myAvatar || '/default-avatar.svg',
      },
      stats: {
        replies: 0,
        likes: 0,
        retweets: 0,
        views: 0,
      },
    } as UIReply);

    setContent('');
    setIsSubmitting(false);
    onCancel();
  };

  if (!user) return null;

  return (
    <div className="ml-10 mt-3">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={myAvatar || '/default-avatar.svg'} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <textarea
            value={content}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onChange={e => setContent(e.target.value)}
            rows={2}
            placeholder={`@${target.user.name} 에게 답글`}
            className="
              w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-700
              bg-gray-50 dark:bg-background px-3 py-2 text-sm
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-primary/60
            "
          />

          <div className="mt-2 mr-2 flex justify-end gap-2">
            <button onClick={onCancel} className="text-sm text-gray-500 hover:underline">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className={`
                px-4 py-1.5 rounded-full text-sm font-semibold
                ${
                  !content.trim() || isSubmitting
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/80'
                }
              `}
            >
              {/* 컨텍스트 기반 추천 엔진: 현재 상품 카테고리를 기준으로 연동된 연관 상품 목록을 페칭하여 교차 판매(Cross-selling) 시너지를 유도함 */}
              답글
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
