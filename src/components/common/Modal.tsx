// src/components/common/Modal.tsx
import { Heart, MessageCircle, Repeat2, Share2, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Avatar from './Avatar';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const [preview, setPreview] = useState<string>('');

  if (!isOpen) return null;

  // 임시 작성 내용 감지 (children이 TweetComposer일 경우, 작성 후 반영 가능)
  const handlePreview = (text: string) => {
    setPreview(text);
  };

  const modalRoot = document.getElementById('modal-root')!;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold">Compose Post</h2>
          <div className="w-6" />
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* Tweet 작성 (자식 컴포넌트) */}
          {children}

          {/* ✅ 작성 후 미리보기 카드 (createTweetElement 디자인 적용) */}
          {preview && (
            <div className="tweet-card p-4 cursor-pointer transition-colors border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50">
              <div className="flex space-x-3">
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=you"
                  alt="You"
                  size={48}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">You</span>
                    <span className="text-secondary">@you</span>
                    <span className="text-secondary">·</span>
                    <span className="text-secondary">now</span>
                  </div>
                  <p className="mt-2 text-gray-900">{preview}</p>

                  <div className="flex items-center justify-between mt-4 max-w-md">
                    <button className="flex items-center space-x-2 text-secondary hover:text-blue-600 group">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-blue-50">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-sm">0</span>
                    </button>
                    <button className="flex items-center space-x-2 text-secondary hover:text-green-600 group">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-green-50">
                        <Repeat2 className="w-4 h-4" />
                      </div>
                      <span className="text-sm">0</span>
                    </button>
                    <button className="flex items-center space-x-2 text-secondary hover:text-red-600 group">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-red-50">
                        <Heart className="w-4 h-4" />
                      </div>
                      <span className="text-sm">0</span>
                    </button>
                    <button className="flex items-center space-x-2 text-secondary hover:text-blue-600 group">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-blue-50">
                        <Share2 className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    modalRoot,
  );
}
