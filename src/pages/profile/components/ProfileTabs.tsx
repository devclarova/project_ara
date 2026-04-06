/**
 * 프로필 콘텐츠 카테고리 내비게이터(Profile Content Category Navigator):
 * - 목적(Why): 사용자가 작성한 게시글, 답글, 좋아요 등 활동 이력을 세부 카테고리별로 분리하여 접근성을 높임
 * - 방법(How): 상태 기반의 탭 전환 로직과 애니메이션 인디케이터(Primary Color)를 결합하여 현재 활성화된 활동 컨텍스트를 명확히 전달함
 */
import { useTranslation } from 'react-i18next';

export type ProfileTabKey = 'posts' | 'replies' | 'likes';

interface ProfileTabsProps {
  activeTab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
}



export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const { t } = useTranslation();

  const tabs: { id: ProfileTabKey; label: string }[] = [
    { id: 'posts', label: t('profile.tab_posts') },
    { id: 'replies', label: t('profile.tab_replies') },
    { id: 'likes', label: t('profile.tab_likes') },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-background">
      <nav className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-4 text-center font-medium transition-colors cursor-pointer whitespace-nowrap relative ${
              activeTab === tab.id
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
