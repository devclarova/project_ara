function StudyCultureNote({ note }: { note: string }) {
  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h4 className="font-semibold mb-2">문화 노트</h4>
      <p className="text-sm text-gray-700">{note}</p>
    </div>
  );
}

export default StudyCultureNote;
