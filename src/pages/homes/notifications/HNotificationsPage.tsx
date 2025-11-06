import { useState } from 'react';
import { mockNotifications } from '../mocks/notifications';
import NotificationCard from '../feature/NotificationCard';

export default function HNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const tabs = [
    { id: 'all', label: '전체', count: notifications.length },
    { id: 'replies', label: '댓글', count: notifications.filter(n => n.type === 'comment').length },
    {
      id: 'mentions',
      label: '멘션',
      count: notifications.filter(n => n.type === 'mention').length,
    },
  ];

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'replies') return notification.type === 'comment';
    if (activeTab === 'mentions') return notification.type === 'mention';
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">알림</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  새로운 알림 {unreadCount}개
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                모두 읽음 처리
              </button>
            )}
          </div>

          {/* 탭 메뉴 */}
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-primary/10'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-primary/20 text-primary font-medium dark:bg-primary/30'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="pb-20">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        ) : (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <i className="ri-notification-3-line text-3xl text-gray-400 dark:text-gray-500"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              아직 새로운 알림이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
              누군가가 내 게시글에 반응하거나 나를 멘션하면 여기에 표시됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
