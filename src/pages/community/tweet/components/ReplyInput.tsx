import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { UIReply } from '@/types/sns';
import { toast } from 'sonner';
import { getBanMessage } from '@/utils/banUtils';

function extractMentions(text: string): string[] {
  const regex = /@([a-zA-Z0-9_.]{2,30})/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    set.add(m[1]);
  }

  return Array.from(set);
}

export function ReplyInput({
  target,
  onCancel,
  onAdded,
  onClose,
}: {
  target: UIReply;
  onCancel: () => void;
  onAdded: (reply: UIReply) => void;
  onClose: () => void;
}) {
  const { user, isBanned, bannedUntil } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('id, avatar_url, nickname')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          setMyAvatar(data.avatar_url);
          setMyNickname(data.nickname ?? null);
        }
      });
  }, [user]);

  // 멘션
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

  const handleSubmit = async () => {
    if (!user || !profileId || !content.trim() || isSubmitting) return;

    // 제재 중인 사용자는 답글 작성 불가
    if (isBanned && bannedUntil) {
      toast.error(getBanMessage(bannedUntil, '댓글을 작성'));
      return;
    }

    setIsSubmitting(true);
    onClose();

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

    const { data, error } = await supabase
      .from('tweet_replies')
      .insert({
        tweet_id: target.tweetId,
        author_id: profileId,
        content: content.trim(),
        parent_reply_id: parentId, // We reply to this specific comment
        root_reply_id: rootId,
      })
      .select()
      .single();

    if (error || !data) {
      setIsSubmitting(false);
      return;
    }

    if (!myNickname) {
      setIsSubmitting(false);
      return; // 또는 toast로 "프로필 로딩중" 표시
    }

    const createdAt = data.created_at ?? new Date().toISOString();

    // 멘션 알림 생성 (댓글/대댓글 저장 성공 후)
    try {
      const mentioned = extractMentions(content);

      // 내가 멘션한 것 중 내 닉네임은 제외 (원하면 조건 제거 가능)
      const filtered = mentioned.filter(m => m !== myNickname);

      if (filtered.length > 0) {
        // nickname 기준으로 멘션 대상 프로필 찾기
        const { data: mentionedProfiles } = await supabase
          .from('profiles')
          .select('id, nickname')
          .in('nickname', filtered);

        if (mentionedProfiles && mentionedProfiles.length > 0) {
          // 멘션된 사용자들에게 알림 전송
          const payloads = mentionedProfiles
            .filter(p => p.id !== profileId) // 자기 자신 멘션 제외
            .map(p => ({
              receiver_id: p.id,
              sender_id: profileId,
              type: 'mention',
              content: content.trim(),
              tweet_id: target.tweetId,
              comment_id: data.id,
              is_read: false,
            }));

          if (payloads.length > 0) {
            await supabase.from('notifications').insert(payloads);
          }
        }
      }
    } catch (e) {
      // Error handled silently
    }

    onAdded({
      id: data.id,
      tweetId: data.tweet_id,
      type: 'reply', // Required by UIReply
      content: data.content,
      createdAt,
      timestamp: createdAt,
      // timestamp: '방금 전', // Placeholder
      liked: false,
      parent_reply_id: parentId,
      root_reply_id: rootId,
      user: {
        name: myNickname,
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
              disabled={!content.trim() || isSubmitting || !profileId || !myNickname}
              className={`
                px-4 py-1.5 rounded-full text-sm font-semibold
                ${
                  !content.trim() || isSubmitting
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/80'
                }
              `}
            >
              답글
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
