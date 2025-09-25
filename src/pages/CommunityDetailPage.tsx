import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Post } from '../types/post';
import { getPostById } from '../services/postService';
import PostDetail from '../components/posts/PostDetail';

const CommunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getPostById(Number(id))
        .then(data => setPost(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <p className="text-center mt-10">불러오는 중...</p>;
  if (!post) return <p className="text-center mt-10">게시글을 찾을 수 없습니다.</p>;

  return <PostDetail post={post} />;
};

export default CommunityDetailPage;
