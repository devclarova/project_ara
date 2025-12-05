import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';

interface NotificationCardProps {
  notification: {
    id: string;
    type: 'like' | 'comment' | 'repost' | 'mention' | 'follow';
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
    replyId?: string | null; // ✅ 여기 기준으로 통일
  };
  onMarkAsRead?: (id: string) => void;
}

export default function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const navigate = useNavigate();

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
      default:
        return '📢';
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

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // ✅ 팔로우 알림 → 프로필로 이동
    if (notification.type === 'follow') {
      navigate(`/profile/${encodeURIComponent(notification.user.username)}`);
      return;
    }

    // ✅ 댓글/댓글 좋아요 알림: tweetId + replyId 둘 다 있을 때 → 해당 댓글로 스크롤
    if (notification.tweetId && notification.replyId) {
      navigate(`/sns/${notification.tweetId}`, {
        state: {
          highlightCommentId: notification.replyId,
        },
      });
      return;
    }

    // ✅ 그 외(피드 좋아요 등)는 피드 디테일로만 이동
    if (notification.tweetId) {
      navigate(`/sns/${notification.tweetId}`);
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${encodeURIComponent(notification.user.username)}`);
  };

  const extractParagraphText = (html: string) => {
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'b', 'i', 'u', 'br'],
      ALLOWED_ATTR: [],
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, 'text/html');

    const paragraphs = Array.from(doc.querySelectorAll('p'));

    if (paragraphs.length > 0) {
      return paragraphs.map(p => p.textContent?.trim() || '').join('\n');
    }

    const bodyText = doc.body.textContent || '';
    return bodyText.trim();
  };

  const parsedContent = notification.content ? extractParagraphText(notification.content) : '';

  // 어떤 타입에 대해 내용 박스를 보여줄지 결정
  const shouldShowPreview =
    (notification.type === 'comment' || notification.type === 'like') && !!parsedContent;

  const unreadClasses = !notification.isRead
    ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary'
    : '';

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 cursor-pointer transition-all duration-200
        bg-white dark:bg-secondary
        hover:bg-primary/5 dark:hover:bg-primary/10
        ${unreadClasses}
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div onClick={handleAvatarClick} className="cursor-pointer flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={notification.user.avatar || '/default-avatar.svg'}
              alt={notification.user.name}
            />
            <AvatarFallback>
              {notification.user.name ? notification.user.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-lg ${getInteractionColor(notification.type)}`}>
              {getInteractionIcon(notification.type)}
            </span>

            <div className="flex-1 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {notification.user.name}님이
              </span>
              <span className="text-gray-600 dark:text-gray-300 ml-1">{notification.action}</span>
            </div>

            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
              {notification.timestamp}
            </span>
          </div>

          {/* 댓글/좋아요 알림일 때 내용 미리보기 */}
          {shouldShowPreview && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-background rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-100 line-clamp-2 whitespace-pre-wrap break-words">
                {parsedContent}
              </p>
            </div>
          )}

          {!notification.isRead && (
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-primary rounded-full mr-2" />
              <span className="text-xs text-primary font-medium">새 알림</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
