// Sidebar.tsx
type SidebarProps<T extends string> = {
  items: T[];
  activeItem: T;
  onSelect: (item: T) => void;
};

export function Sidebar<T extends string>({ items, activeItem, onSelect }: SidebarProps<T>) {
  return (
    <aside className="w-48 pr-6 border-r">
      <h2 className="font-bold mb-4">커뮤니티</h2>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item}>
            <button
              onClick={() => onSelect(item)}
              className={`block w-full text-left px-3 py-2 rounded 
                ${activeItem === item ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
