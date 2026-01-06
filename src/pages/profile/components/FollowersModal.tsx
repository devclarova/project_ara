import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FollowUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio?: string | null;
  isFollowing: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  // Mock data for UI demonstration
  followers?: FollowUser[];
  following?: FollowUser[];
}

export default function FollowersModal({
  isOpen,
  onClose,
  initialTab = 'followers',
  followers = [],
  following = [],
}: FollowersModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleFollowToggle = (userId: string, currentState: boolean) => {
    // Update local state for UI feedback
    setFollowStates(prev => ({
      ...prev,
      [userId]: !currentState,
    }));
    
    // Show placeholder toast
    toast.info(t('profile.follow_feature_coming_soon'));
  };

  const currentUsers = activeTab === 'followers' ? followers : following;
  
  const filteredUsers = currentUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-secondary w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {activeTab === 'followers' ? t('profile.followers_list') : t('profile.following_list')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <i className="ri-close-line text-xl text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'followers'
                ? 'text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('profile.followers')}
            {activeTab === 'followers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00dbaa] to-[#009e89]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'following'
                ? 'text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('profile.following')}
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00dbaa] to-[#009e89]" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('profile.search_users')}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 transition-all"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map(user => {
                const isFollowing = followStates[user.id] ?? user.isFollowing;
                
                return (
                  <div
                    key={user.id}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={user.avatar || '/default-avatar.svg'} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          @{user.username}
                        </p>
                        {user.bio && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-1">
                            {user.bio}
                          </p>
                        )}
                      </div>

                      {/* Follow Button */}
                      <Button
                        onClick={() => handleFollowToggle(user.id, isFollowing)}
                        variant="outline"
                        className={`flex-shrink-0 rounded-full px-4 font-medium transition-all ${
                          isFollowing
                            ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                            : 'bg-gradient-to-r from-[#00dbaa] to-[#009e89] text-white border-transparent hover:opacity-90'
                        }`}
                      >
                        {isFollowing ? (
                          <span className="group-hover:hidden">{t('profile.following')}</span>
                        ) : (
                          t('profile.follow')
                        )}
                        {isFollowing && (
                          <span className="hidden group-hover:inline">{t('profile.unfollow')}</span>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <i className="ri-user-line text-4xl mb-2" />
              <p className="text-sm">
                {searchQuery
                  ? t('common.no_result')
                  : activeTab === 'followers'
                    ? t('profile.no_followers')
                    : t('profile.no_following')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
