import HighlightText from '../common/HighlightText';

export function Row({ label, onClick, searchQuery }: { label: string; onClick?: () => void; searchQuery?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm transition text-gray-900 font-medium hover:bg-gray-100 dark:hover:bg-primary/10 hover:text-gray-700 dark:hover:text-gray-300"
    >
      <span className="text-sm text-gray-900 dark:text-gray-200">
        <HighlightText text={label} query={searchQuery} />
      </span>
      <span className="text-gray-400 dark:text-gray-200">›</span>
    </button>
  );
}
