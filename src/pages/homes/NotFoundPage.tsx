// NotFoundPage.tsx
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <h1 className="text-5xl md:text-5xl font-semibold text-gray-100">404</h1>
      <h1 className="text-2xl md:text-3xl font-semibold mt-6">This page has not been generated</h1>
      <p className="mt-4 text-xl md:text-2xl text-gray-500">
        Tell me what you would like on this page
      </p>

      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate(-1)}
        className="mt-8 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/80 transition"
      >
        ← Go Back
      </button>
    </div>
  );
}
