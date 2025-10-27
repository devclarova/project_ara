export function Row({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm transition text-gray-900 font-medium hover:bg-gray-100 hover:text-gray-700"
    >
      <span className="text-sm text-gray-900">{label}</span>
      <span className="text-gray-400">›</span>
    </button>
  );
}
