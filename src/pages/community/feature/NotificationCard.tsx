import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko, enUS, ja, zhCN, fr, de, es, pt, ptBR, ru, fi, vi, th, hi, bn, arSA } from 'date-fns/locale';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Repeat2, 
  AtSign, 
  ShieldCheck,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatSmartDate } from '@/utils/dateUtils';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';



interface NotificationCardProps {
  notification: {
    id: string;
    type: 'like' | 'comment' | 'repost' | 'mention' | 'follow' | 'reply' | 'system' | 'like_comment' | 'like_feed';
    user: {
      name: string;
      username: string;
      avatar: string;
    };
    action: string;
    content: string | null;
    timestamp: string;
    isRead: boolean;
    tweetId: string | null;
    replyId?: string | null;
  };
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSilentDelete?: (id: string) => void;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onSilentDelete,
}: NotificationCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract adminComment for auto-translation if it's a system notification
  const getAdminComment = (contentJson: string | null) => {
    if (!contentJson) return null;
    try {
      const payload = JSON.parse(contentJson);
      return payload?.data?.adminComment || null;
    } catch (e) {
      return null;
    }
  };

  const adminComment = notification.type === 'system' ? getAdminComment(notification.content) : null;
  const { translatedText: translatedAdminComment, isLoading: isTranslating } = useAutoTranslation(
    adminComment || '',
    `admin_comment_${notification.id}`,
    i18n.language
  );

  const FEED_LIKE_MESSAGE = t('notification.like_feed');

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'repost':
        return '🔁';
      case 'mention':
        return '🏷️';
      case 'follow':
        return '👤';
      case 'system':
        return '📢';
      default:
        return '📢';
    }
  };

  const getSystemNotificationContent = (contentJson: string | null) => {
    if (!contentJson) return '';
    try {
      const payload = JSON.parse(contentJson);
      if (!payload.type || !payload.data) return contentJson;

      const { type, data } = payload;
      
      const localeMap: Record<string, any> = {
        'ko': ko, 'en': enUS, 'ja': ja, 'zh': zhCN, 'fr': fr, 'de': de, 
        'es': es, 'pt': pt, 'pt-br': ptBR, 'ru': ru, 'fi': fi,
        'vi': vi, 'th': th, 'hi': hi, 'bn': bn, 'ar': arSA
      };
      const currentLang = i18n.language.toLowerCase();
      const baseLang = currentLang.split('-')[0];
      const currentDateLocale = localeMap[currentLang] || localeMap[baseLang] || enUS;

      const formatBanUntil = (until: string | null) => {
        if (!until) return t('common.permanent', '영구');
        return format(new Date(until), 'yyyy. MM. dd. HH:mm', { locale: currentDateLocale });
      };

      const formatBanDuration = (duration: any, days: number | null) => {
        if (duration === 'permanent') return t('common.permanent', '영구');
        return `${days}${t('common.days', '일')}`;
      };

      const reportReason = data.reportReasonKey ? t(data.reportReasonKey) : t('report.reasons.other');
      const durationStr = formatBanDuration(data.duration, data.durationDays);
      const untilStr = formatBanUntil(data.until);

      const getDisplayedComment = (original: string) => {
        if (translatedAdminComment) return translatedAdminComment;
        return original;
      };

      if (type === 'system_ban_report') {
        return `<strong>${t('notification.system.ban_title')}</strong><br/><br/>` +
               `${t('notification.system.ban_prefix')}<br/><br/>` +
               `<strong>[${t('report.reason', '신고 사유')}]</strong>: ${reportReason}<br/>` +
               `<strong>[${t('admin.review_comment', '운영팀 검토 의견')}]</strong>: ${getDisplayedComment(data.adminComment)}<br/><br/>` +
               `${t('notification.system.ban_duration', { duration: durationStr })}<br/>` +
               `${t('notification.system.ban_until', { until: untilStr })}<br/>` +
               `${t('notification.system.ban_features')}<br/><br/>` +
               `${t('notification.system.ban_footer')}`;
      }

      if (type === 'system_ban_direct') {
        return `<strong>${t('notification.system.ban_title')}</strong><br/><br/>` +
               `${t('notification.system.ban_prefix')}<br/><br/>` +
               `<strong>[${t('admin.reason', '운영팀 사유')}]</strong>: ${getDisplayedComment(data.adminComment)}<br/><br/>` +
               `${t('notification.system.ban_duration', { duration: durationStr })}<br/>` +
               `${t('notification.system.ban_until', { until: untilStr })}<br/>` +
               `${t('notification.system.ban_features')}<br/><br/>` +
               `${t('notification.system.ban_footer')}`;
      }

      if (type === 'system_unban') {
        return `<strong>${t('notification.system.unban_title')}</strong><br/><br/>` +
               `${t('notification.system.unban_message')}`;
      }

      if (type === 'system_reporter_feedback') {
        let actionStr = '';
        if (data.actionType === 'ban') actionStr = `${durationStr} ${t('common.ban', '이용 제한')}`;
        else if (data.actionType === 'delete') actionStr = t('common.content_deleted', '콘텐츠 삭제');
        else if (data.actionType === 'dismiss') actionStr = t('report.status.dismissed', '신고 기각');

        const reasonKeyToUse = (data.reasonKey && data.reasonKey !== 'undefined') ? data.reasonKey : (data.reportReasonKey || 'report.reasons.other');
        return `<strong>${t('notification.system.reporter_title')}</strong><br/><br/>` +
               `${t('notification.system.reporter_prefix')}` +
               `${t('notification.system.reporter_target', { target: data.target })}<br/>` +
               `${t('notification.system.reporter_reason', { reason: t(reasonKeyToUse) })}<br/>` +
               `${t('notification.system.reporter_action', { action: actionStr })}<br/>` +
               `${t('notification.system.reporter_footer')}`;
      }

      return payload ? contentJson : contentJson; // Fallback
    } catch (e) {
      return contentJson;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'like':
      case 'comment':
      case 'repost':
      case 'mention':
      case 'follow':
        return 'text-primary';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const parseContent = (html: string) => {
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'b', 'i', 'u', 'br', 'img'],
      ALLOWED_ATTR: ['src', 'alt'],
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, 'text/html');

    const img = doc.querySelector('img');
    const imageUrl = img?.getAttribute('src');

    const paragraphs = Array.from(doc.querySelectorAll('p'));
    let text = '';

    if (paragraphs.length > 0) {
      text = paragraphs.map(p => p.textContent?.trim() || '').join('\n');
    } else {
      text = doc.body.textContent?.trim() || '';
    }

    if (!text && imageUrl) {
        text = t('notification.media_photo');
    }

    return { text, imageUrl };
  };

  const { text: contentText, imageUrl } = notification.content 
    ? parseContent(notification.content) 
    : { text: '', imageUrl: null };

  // 댓글 좋아요인데 content가 없는 경우 체크
  const isCommentLikeWithoutContent = 
    notification.type === 'like' && notification.replyId && !contentText && !imageUrl;
  
  // 어떤 타입에 대해 내용 박스를 보여줄지 결정
  const shouldShowPreview =
    (notification.type === 'comment' || notification.type === 'like' || notification.type === 'mention' || notification.type === 'reply' || notification.type === 'system') 
    && (!!contentText || !!imageUrl || isCommentLikeWithoutContent);

  const unreadClasses = !notification.isRead
    ? 'bg-primary/10 dark:bg-primary/20'
    : '';

  // 알림 유형/상태에 따른 왼쪽 바 색상 결정
  const sideBarClasses = !notification.isRead
      ? 'border-l-4 border-l-primary'
      : 'border-l-4 border-l-transparent';

  // "삭제된 댓글"로 취급해야 하는 알림인지 판별
  // type === 'comment' 이면서 replyId 없음 → 원래 댓글 알림인데 댓글이 삭제된 케이스
  // 참고: type === 'like' 이면서 replyId 없음 → 정상적인 게시글 좋아요 (삭제된 댓글 아님)
  // 댓글 좋아요(type === 'like' + replyId 있음)의 삭제 체크는 handleClick 내부의 DB 조회로 처리
  const isDeletedCommentNotification =
    notification.type === 'comment' && !notification.replyId;

  // Check logic inside handleClick
  const handleClick = async () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // 시스템 알림은 이동 로직 없이 읽음 처리만 함
    if (notification.type === 'system') return;

    const targetProfile = `/profile/${encodeURIComponent(notification.user.username)}`;
    const targetSns = `/sns/${notification.tweetId}`;

    // 팔로우 알림 → 프로필로 이동
    if (notification.type === 'follow') {
      if (location.pathname !== targetProfile) {
        navigate(targetProfile);
      }
      return;
    }

    // 게시글 자체가 삭제된 경우 (tweetId가 null인 경우)
    if (!notification.tweetId) {
      toast.info(t('notification.deleted_post'));
      onSilentDelete?.(notification.id); // 게시글 삭제됨 -> 알림 삭제
      return;
    }

    // "삭제된 댓글"로 판단되는 알림 (이미 정보가 불완전한 경우)
    if (isDeletedCommentNotification) {
      toast.info(t('notification.deleted_comment'));
      
      if (location.pathname !== targetSns) {
        navigate(targetSns);
      }
      onSilentDelete?.(notification.id);
      return;
    }

    // 댓글/댓글 좋아요 알림: tweetId + replyId 둘 다 있을 때 -> 실제 DB 존재 여부 확인
    if (notification.tweetId && notification.replyId) {
      // 1. 실제로 댓글이 존재하는지 확인 (DB 체크)
      const { data: replyExists } = await supabase
        .from('tweet_replies')
        .select('id')
        .eq('id', notification.replyId)
        .maybeSingle();

      if (!replyExists) {
        // 이미 삭제된 댓글임
        toast.info(t('notification.deleted_comment'));
        
        // 그래도 게시글로 이동은 함 (사용자 경험 유지) - 먼저 이동
        if (location.pathname !== targetSns) {
           navigate(targetSns);
        }
        
        // 이동 후 삭제 (컴포넌트 언마운트되더라도 실행됨)
        onSilentDelete?.(notification.id); 
        return;
      }

      // 2. 존재하면 정상 이동 + 하이라이트
      navigate(targetSns, {
        replace: location.pathname === targetSns,
        state: {
          highlightCommentId: notification.replyId,
          scrollKey: Date.now(),
        },
      });
      return;
    }

    // 그 외는 피드 디테일로만 이동
    if (notification.tweetId) {
      if (location.pathname !== targetSns) {
        navigate(targetSns);
      }
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    if (notification.type === 'system') return; // 시스템 계정은 프로필 페이지 없음
    const targetProfile = `/profile/${encodeURIComponent(notification.user.username)}`;
    if (location.pathname !== targetProfile) {
      navigate(targetProfile);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative overflow-hidden
        p-4 cursor-pointer transition-all duration-200
        bg-white dark:bg-zinc-900/50
        hover:bg-primary/5 dark:hover:bg-primary/10
        ${!notification.isRead ? 'bg-primary/5 dark:bg-primary/5' : ''}
      `}
    >
      {/* ARA Style Side Bar */}
      {!notification.isRead && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 bg-primary transition-colors duration-300"
        />
      )}
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div onClick={handleAvatarClick} className="cursor-pointer flex-shrink-0 relative">
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={notification.user.avatar || '/default-avatar.svg'}
              alt={notification.user.name}
            />
            <AvatarFallback>
              {notification.type === 'system' ? '📢' : (notification.user.name ? notification.user.name.charAt(0).toUpperCase() : 'U')}
            </AvatarFallback>
          </Avatar>
          {notification.type !== 'system' && (
            <OnlineIndicator 
              userId={notification.user.username} 
              size="sm" 
              className="absolute -bottom-0.5 -right-0.5 z-10 border-white dark:border-secondary border-2"
            />
          )}
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start space-x-2 sm:space-x-3 mb-1">
            <span className={`text-base sm:text-lg flex-shrink-0 ${getInteractionColor(notification.type)}`}>
              {getInteractionIcon(notification.type)}
            </span>

            <div className="flex-1 min-w-0">
              <div className="line-clamp-2">
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                  {notification.user.name}
                </span>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 ml-1">
                  {notification.type === 'like' && (notification.replyId ? t('notification.like_comment') : t('notification.like_feed'))}
                  {notification.type === 'comment' && t('notification.comment_feed')}
                  {notification.type === 'reply' && t('notification.comment_feed')}
                  {notification.type === 'follow' && t('notification.follow_msg')}
                  {notification.type === 'repost' && t('notification.repost_msg')}
                  {notification.type === 'mention' && t('notification.mention_msg')}
                  {notification.type === 'system' && t('notification.system_notice', '시스템 알림')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatSmartDate(notification.timestamp)}
              </span>
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-1 sm:p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                  title={t('common.delete')}
                >
                  <i className="ri-delete-bin-line text-base sm:text-lg" />
                </button>
              )}
            </div>
          </div>

          {/* 댓글/좋아요/멘션/답글/시스템 알림일 때 내용 미리보기 */}
          {shouldShowPreview && (
            <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-gray-50/50 dark:bg-zinc-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 flex flex-row items-center gap-2 sm:gap-3">
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words flex-1 leading-relaxed w-full">
                {isCommentLikeWithoutContent 
                  ? t('notification.no_content_available', '내용을 불러올 수 없습니다')
                  : notification.type === 'system' 
                    ? <div 
                        className="text-sm text-gray-800 dark:text-gray-200 break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(getSystemNotificationContent(notification.content)) 
                        }} 
                      />
                    : <span className="line-clamp-2">{contentText}</span>
                }
              </div>
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt="preview" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0 border border-black/5 dark:border-white/5 bg-gray-200 dark:bg-gray-800"
                />
              )}
            </div>
          )}

          {!notification.isRead && (
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-primary rounded-full mr-2" />
              <span className="text-xs text-primary font-medium">{t('notification.new')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
