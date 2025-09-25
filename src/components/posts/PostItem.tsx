import { useNavigate } from 'react-router-dom';
import type { Post } from '../../types/database';

interface PostItemProps {
  post: Post;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/posts/${post.id}`)}
      className="cursor-pointer p-4 mb-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
    >
      <h3 className="text-lg font-bold mb-2">{post.title}</h3>
      <p className="text-sm text-gray-500 mb-2">{post.category}</p>
      <p className="text-gray-700">{post.content}</p>
    </div>
  );
};

export default PostItem;
