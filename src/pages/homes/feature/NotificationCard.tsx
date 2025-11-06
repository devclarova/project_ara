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
        return 'text-gray-500';
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
    // 1️⃣ 안전하게 sanitize — <p>, <strong>, <em> 등 텍스트 관련 태그만 허용
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'b', 'i', 'u', 'br'],
      ALLOWED_ATTR: [],
    });

    // 2️⃣ DOMParser로 <p> 내용만 추출
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, 'text/html');
    const paragraphs = Array.from(doc.querySelectorAll('p'));

    // 3️⃣ 모든 <p>의 텍스트를 이어붙이기
    const text = paragraphs.map(p => p.textContent?.trim() || '').join('\n');

    return text;
  };

  const parsedContent = notification.content
    ? extractParagraphText(notification.content)
    : '';

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b border-gray-100 transition-all duration-200 cursor-pointer hover:bg-primary/5 ${
        !notification.isRead ? 'bg-primary/10 border-l-4 border-l-primary' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* shadcn Avatar */}
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

            <div className="flex-1">
              <span className="font-semibold text-gray-900">{notification.user.name}님이</span>
              <span className="text-gray-600 ml-1">{notification.action}</span>
            </div>

            <span className="text-sm text-gray-500 flex-shrink-0">{notification.timestamp}</span>
          </div>

          {parsedContent && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 line-clamp-2 whitespace-pre-wrap break-words">
                {parsedContent}
              </p>
            </div>
          )}

          {!notification.isRead && (
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              <span className="text-xs text-primary font-medium">새 알림</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
