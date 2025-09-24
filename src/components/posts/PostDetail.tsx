import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Post } from '../../types/post';
import { getPostById } from '../../services/postService';

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  return (
    <div>
      <h1>{post.title}</h1>
      <p>카테고리: {post.category}</p>
      <p>{post.content}</p>

      <div>
        <span>작성일: {new Date(post.created_at).toLocaleDateString()}</span>
        <span>조회수: {post.view}</span>
      </div>
    </div>
  );
};
