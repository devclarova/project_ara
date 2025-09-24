import React from 'react';
import { usePosts } from '../../contexts/PostContext';
import PostItem from './PostItem';

const PostList = () => {
  const { state } = usePosts();
  const { posts, loading, error } = state;

  if (loading) return <p className="text-center text-gray-500 mt-4">게시글 불러오는 중...</p>;

  if (error) return <p className="text-center text-red-500 mt-4">{error}</p>;

  if (!posts || posts.length === 0)
    return <p className="text-center text-gray-400 mt-4">게시글이 없습니다.</p>;

  return (
    <div className="grid grid-cols-1 gap-4 mt-4">
      {posts.map(post => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;
