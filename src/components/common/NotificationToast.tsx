import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';

interface NotificationToastProps {
  type: 'chat' | 'comment' | 'like' | 'mention' | 'follow' | 'repost';
  sender: {
    nickname: string;
    avatar_url: string | null;
  };
  content: string;
  timestamp: string;
  replyId?: string | null;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  sender,
  content,
  timestamp,
  replyId,
}) => {
  const { t, i18n } = useTranslation();

  const getStyles = () => {
    switch (type) {
      case 'chat': return {
        icon: '💬',
        label: t('chat.new_message', '새 메시지'),
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        iconBg: 'bg-blue-100 dark:bg-blue-800',
        textColor: 'text-blue-600 dark:text-blue-400',
        badgeColor: 'text-blue-500'
      };
      case 'like': return {
        icon: '❤️',
        label: replyId 
          ? t('notification.action_like_comment', '회원님의 댓글을 좋아합니다')
          : t('notification.action_like_feed', '회원님의 게시글을 좋아합니다'),
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        iconBg: 'bg-rose-100 dark:bg-rose-800',
        textColor: 'text-rose-600 dark:text-rose-400',
        badgeColor: 'text-rose-500'
      };
      case 'comment': return {
        icon: '💬',
        label: t('notification.action_comment', '댓글을 남겼습니다'),
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        iconBg: 'bg-emerald-100 dark:bg-emerald-800',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        badgeColor: 'text-emerald-500'
      };
      case 'follow': return {
        icon: '👤',
        label: t('notification.follow_msg', '회원님을 팔로우합니다'),
        bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
        iconBg: 'bg-cyan-100 dark:bg-cyan-800',
        textColor: 'text-cyan-600 dark:text-cyan-400',
        badgeColor: 'text-cyan-500'
      };
      case 'mention': return {
        icon: '🏷️',
        label: t('notification.action_mention', '님을 언급했습니다'),
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        iconBg: 'bg-indigo-100 dark:bg-indigo-800',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        badgeColor: 'text-indigo-500'
      };
      case 'repost': return {
        icon: '🔁',
        label: t('notification.action_repost', '게시글을 공유했습니다'),
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        iconBg: 'bg-amber-100 dark:bg-amber-800',
        textColor: 'text-amber-600 dark:text-amber-400',
        badgeColor: 'text-amber-500'
      };
      default: return {
        icon: '📢',
        label: '',
        bgColor: 'bg-zinc-50 dark:bg-zinc-900/20',
        iconBg: 'bg-zinc-100 dark:bg-zinc-800',
        textColor: 'text-zinc-600 dark:text-zinc-400',
        badgeColor: 'text-zinc-500'
      };
    }
  };

  const styles = getStyles();

  const formatTime = (ts: string) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return '';
      const currentLang = i18n.language || 'ko';
      return new Intl.DateTimeFormat(currentLang, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch {
      return '';
    }
  };

  return (
    <div className="flex items-start space-x-3 w-full group animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex-shrink-0 relative">
        <div className={`absolute -inset-1 rounded-full opacity-10 blur-[2px] transition-opacity group-hover:opacity-20 ${styles.iconBg}`}></div>
        <Avatar className="w-10 h-10 border border-white/20 dark:border-white/10 shadow-sm relative z-10">
          <AvatarImage src={sender.avatar_url || '/default-avatar.svg'} alt={sender.nickname} />
          <AvatarFallback className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
            {sender.nickname?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-1 -right-1 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md border-2 border-white dark:border-zinc-900 z-20 ${styles.iconBg}`}>
          {styles.icon}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
            {sender.nickname}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 whitespace-nowrap tabular-nums">
            {formatTime(timestamp)}
          </span>
        </div>
        
        <p className={`text-[12px] font-semibold mb-1 leading-tight ${styles.textColor}`}>
          {styles.label}
        </p>
        
        {type !== 'like' && type !== 'follow' && (
          <div className="relative">
            <p className="text-[13px] text-gray-700 dark:text-zinc-300 line-clamp-2 break-words leading-snug font-medium">
              {content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
