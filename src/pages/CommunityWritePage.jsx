import React from 'react';
import PostWrite from '../components/posts/PostWrite';

const CommunityWritePage = () => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">게시글 작성</h1>
      <PostWrite />
    </div>
  );
};

export default CommunityWritePage;
