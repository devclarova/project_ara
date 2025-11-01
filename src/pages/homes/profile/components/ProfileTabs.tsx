interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs = [
    { id: 'posts', label: 'Posts' },
    { id: 'replies', label: 'Replies' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'media', label: 'Media' },
    { id: 'likes', label: 'Likes' }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-4 text-center font-medium transition-colors cursor-pointer whitespace-nowrap relative ${
              activeTab === tab.id
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}