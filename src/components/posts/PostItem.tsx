import { useNavigate } from 'react-router-dom';
import type { Post } from '../../types/database';

interface PostItemProps {
  post: Post;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate(`/posts/${post.id}`)}>
      <h3>{post.title}</h3>
      <p>{post.category}</p>
      <p>{post.content}</p>
    </div>
  );
};

export default PostItem;
