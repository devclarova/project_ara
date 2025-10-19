import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TweetHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center space-x-8">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-800" />
      </button>

      {/* 제목 */}
      <h1 className="text-xl font-bold text-gray-900">Post</h1>
    </header>
  );
};

export default TweetHeader;
