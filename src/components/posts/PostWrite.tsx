import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { useState } from 'react';
import type { PostInsert } from '../../types/post';

const PostWrite = () => {
  const navigate = useNavigate();
  const { addPost } = usePosts();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      await addPost({
        title,
        content,
        category: null,
        comments: 0,
        like: 0,
        unlike: 0,
        view: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as PostInsert);
      navigate('/communitylist');
    } catch (error) {
      console.log(error);
      alert('게시글 작성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">게시글 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">제목</label>
          <input
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">내용</label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
          />
        </div>
        <button
          type="submit"
          onClick={() => navigate('/communitylist')}
          className="w-full bg-primary text-white font-semibold py-2 rounded-md hover:hover:brightness-90 transition duration-200"
        >
          작성 완료
        </button>
      </form>
    </div>
  );
};

export default PostWrite;
