import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { useState } from 'react';
import type { PostInsert } from '../../types/post';

const categories = ['Reviews', 'Q&A', 'Study tips', 'Communication'];

const PostWrite = () => {
  const navigate = useNavigate();
  const { addPost } = usePosts();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(categories[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content) {
      alert('Please provide a title and content.');
      return;
    }

    try {
      await addPost({
        title,
        content,
        category,
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
      alert('Unable to create the post.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start pt-6 pb-6">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-md p-10">
        <h2 className="text-3xl font-bold mb-8 text-center">Create Post</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Category</label>
            <select
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="Reviews">Reviews</option>
              <option value="Q&A">Q&A</option>
              <option value="Study tips">Study tips</option>
              <option value="Communication">Communication</option>
            </select>
          </div>

          {/* 제목 입력 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Title</label>
            <input
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter a title"
            />
          </div>

          {/* 내용 입력 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Content</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 h-60 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Please enter the content."
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full bg-primary text-white font-semibold py-3 rounded-md hover:brightness-90 transition duration-200"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostWrite;
