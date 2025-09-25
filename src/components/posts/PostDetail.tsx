import type { Post } from '../../types/post';

interface PostDetailProps {
  post: Post;
}

const categoryColors: Record<string, string> = {
  Reviews: 'text-sm text-yellow-600 border border-yellow-100 rounded-md px-2 py-0 bg-yellow-100',
  'Q&A': 'text-sm text-blue-600 border border-blue-100 rounded-md px-2 py-0 bg-blue-100',
  'Study tips': 'text-sm text-green-600 border border-green-100 rounded-md px-2 py-0 bg-green-100',
  Communication:
    'text-sm text-purple-600 border border-purple-100 rounded-md px-2 py-0 bg-purple-100',
};

const PostDetail: React.FC<PostDetailProps> = ({ post }) => {
  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6 mt-8 mb-8">
      {/* 카테고리와 작성일 */}
      <div className="flex justify-start gap-5 items-center text-gray-500 text-sm mb-4">
        <p className={categoryColors[post.category || '']}>{post.category}</p>
        <span>작성일: {new Date(post.created_at).toLocaleDateString()}</span>
        <div className="text-gray-500 text-sm">조회수: {post.view}</div>
      </div>

      {/* 제목 */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h1>

      {/* 내용 */}
      <p className="text-gray-700 leading-relaxed mb-6">{post.content}</p>

      {/* 조회수 */}
      {/* <div className="flex gap-5 justify-end pr-3">
        <div className="text-gray-500 text-sm">조회수: {post.view}</div>
        <div className="text-gray-500 text-sm">댓글수: {post.comments}</div>
      </div> */}

      {/* 댓글 영역 */}
      <div className="mt-8 pt-3 border-t border-gray-300">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">댓글({post.comments})</h2>

        {/* 댓글 입력 */}
        <div className="mb-6">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="댓글을 작성해주세요..."
          />
          <button className="mt-2 bg-primary text-white px-4 py-2 rounded-lg hover:brightness-90 transition duration-200">
            댓글 작성
          </button>
        </div>

        {/* 댓글 리스트 */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">나</p>
            <p className="text-gray-700 mt-1">댓글</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex gap-5">
              <p className="text-sm text-gray-500">너</p>
              <p className="text-sm text-gray-500">{post.created_at}</p>
            </div>
            <p className="text-gray-700 mt-1">
              댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글댓글
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex gap-5">
              <p className="text-sm text-gray-500">누구</p>
              <p className="text-sm text-gray-500">{post.created_at}</p>
            </div>
            <p className="text-gray-700 mt-1">댓글</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
