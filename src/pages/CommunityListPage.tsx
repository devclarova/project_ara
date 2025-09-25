import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostList from '../components/posts/PostList';

const CommunityListPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Community Boards</h1>

      <button
        onClick={() => navigate('/communitywrite')}
        className="mb-6 px-4 py-2 bg-primary text-white rounded hover:brightness-90 transition duration-200"
      >
        Create Post
      </button>

      <PostList />
    </div>
  );
};

export default CommunityListPage;
