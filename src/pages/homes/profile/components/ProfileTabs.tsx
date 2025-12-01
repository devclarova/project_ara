// src/pages/homes/profile/components/ProfileTabs.tsx (예시 경로)

export type ProfileTabKey = 'posts' | 'replies' | 'likes';

interface ProfileTabsProps {
  activeTab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
}

const tabs: { id: ProfileTabKey; label: string }[] = [
  { id: 'posts', label: '게시글' },
  { id: 'replies', label: '댓글' },
  { id: 'likes', label: '좋아요' },
];

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
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
