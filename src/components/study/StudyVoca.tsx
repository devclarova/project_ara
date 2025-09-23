function StudyVoca({ words }: { words: { term: string; meaning: string; example?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {words.map((w, i) => (
        <div key={i} className="p-3 border rounded-lg bg-white shadow-sm hover:bg-gray-50">
          <h4 className="font-semibold">{w.term}</h4>
          <p className="text-sm text-gray-600">{w.meaning}</p>
          {w.example && <p className="text-xs text-gray-400 mt-1">예: {w.example}</p>}
        </div>
      ))}
    </div>
  );
}

export default StudyVoca;
