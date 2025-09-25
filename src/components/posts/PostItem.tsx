import { useNavigate } from 'react-router-dom';
import type { Post } from '../../types/database';

interface PostItemProps {
  post: Post;
}

const categoryColors: Record<string, string> = {
  Reviews: 'text-sm text-yellow-600 border border-yellow-100 rounded-md px-2 py-0 bg-yellow-100',
  'Q&A': 'text-sm text-blue-600 border border-blue-100 rounded-md px-2 py-0 bg-blue-100',
  'Study tips': 'text-sm text-green-600 border border-green-100 rounded-md px-2 py-0 bg-green-100',
  Communication:
    'text-sm text-purple-600 border border-purple-100 rounded-md px-2 py-0 bg-purple-100',
};

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/communitydetail/${post.id}`)}
      className="cursor-pointer p-4 mb-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 flex flex-col"
    >
      <div className="flex items-center justify-start mb-2 gap-5">
        <p className={categoryColors[post.category || '']}>{post.category}</p>
        <p className="text-xs text-gray-400">{post.created_at}</p> {/* 날짜 추가 */}
      </div>
      <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
      <p className="text-gray-700 text-sm line-clamp-3">{post.content}</p>
      <div className="flex items-center mt-3 text-gray-400 text-xs">
        <span className="mr-4">👍 {post.like}</span>
        <span>💬 {post.comments}</span>
      </div>
    </div>
  );
};

export default PostItem;
