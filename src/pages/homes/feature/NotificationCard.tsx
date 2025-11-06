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

    if (notification.type === 'follow') {
      navigate(`/profile/${notification.user.username}`);
    } else if (notification.tweetId) {
      navigate(`/finalhome/${notification.tweetId}`);
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/finalhome/user/${notification.user.name}`);
  };

  /** ✅ HTML에서 이미지·미디어 제거하고 <p> 내용만 추출하는 함수 */
  const extractParagraphText = (html: string) => {
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'b', 'i', 'u', 'br'],
      ALLOWED_ATTR: [],
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, 'text/html');
    const paragraphs = Array.from(doc.querySelectorAll('p'));
    const text = paragraphs.map(p => p.textContent?.trim() || '').join('\n');
    return text;
  };

  const parsedContent = notification.content ? extractParagraphText(notification.content) : '';

  const unreadClasses = !notification.isRead
    ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary'
    : '';

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 cursor-pointer transition-all duration-200
        border-b border-gray-100 dark:border-gray-800
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

          {parsedContent && (
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
