// 프로필 탭바

export type TabItem<T extends string = string> = {
  id: T;
  label: string;
  count?: number;
};

type ProfileTabBarProps<T extends string = string> = {
  activeId: T;
  tabs: TabItem<T>[];
  onChange: (id: T) => void;
  className?: string;
};

function ProfileTabBar<T extends string = string>({
  activeId,
  tabs,
  onChange,
  className = '',
}: ProfileTabBarProps<T>) {
  return (
    <div className={`sticky top-0 bg-white border-b ${className}`}>
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 h-12 px-5 font-medium text-sm transition-all duration-200 cursor-pointer relative ${
              activeId === tab.id
                ? 'text-[#00bdaa] font-semibold'
                : 'text-[#6b7280] hover:text-[#00bdaa]'
            }`}
          >
            <span>
              {tab.label}
              {typeof tab.count === 'number' ? ` (${tab.count})` : ''}
            </span>
            {activeId === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00bdaa] rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProfileTabBar;
