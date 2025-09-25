import React, { useEffect } from 'react';
import { createPortal } from 'react-dom'; // Portal을 사용해서 모달을 body 바로 아래 렌더링

// 모달 버튼 타입 정의
interface ModalButton {
  label: string; // 버튼 텍스트
  onClick?: () => void; // 클릭 시 실행할 함수 (선택)
  type?: 'primary' | 'default'; // 버튼 스타일 구분 (기본값은 'default')
}

// 모달 컴포넌트 Props 정의
interface ModalProps {
  isOpen: boolean; // 모달 열림 여부
  title?: string; // 모달 제목 (선택)
  message?: string; // 모달 내용 메시지 (선택)
  buttons?: ModalButton[]; // 모달 하단 버튼 배열 (선택)
  onClose?: () => void; // 모달 닫기 함수 (선택)
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  buttons = [], // 버튼 배열 기본값 빈 배열
  onClose,
}) => {
  // ==============================
  // ESC 키로 모달 닫기 기능
  // ==============================
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose(); // ESC 누르면 모달 닫기
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // ==============================
  // 모달이 열릴 때 body 스크롤 잠금
  // ==============================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // 페이지 스크롤 금지
      document.documentElement.style.height = '100%'; // html 높이 100%
      document.body.style.height = '100%'; // body 높이 100%
    } else {
      document.body.style.overflow = 'auto'; // 스크롤 원래대로
      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
    }
  }, [isOpen]);

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null;

  // ==============================
  // 모달 렌더링 (React Portal 사용)
  // ==============================
  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={onClose} // 배경(overlay) 클릭 시 모달 닫기
    >
      {/* 모달 본문 */}
      <div
        className="bg-white rounded-xl shadow-lg w-96 max-w-[90%] p-6"
        onClick={e => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 막기
      >
        {/* 모달 제목 */}
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}

        {/* 모달 메시지 */}
        {message && <p className="mb-6">{message}</p>}

        {/* 하단 버튼 영역 */}
        <div className="flex justify-end space-x-3">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => {
                btn.onClick?.(); // 버튼 클릭 시 함수 실행
                onClose?.(); // 모달 닫기
              }}
              className={`px-4 py-2 rounded font-medium text-sm ${
                btn.type === 'primary'
                  ? 'bg-primary text-white hover:brightness-90 transition duration-200' // primary 버튼: 색상 유지, 호버 시 살짝 어둡게
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300' // default 버튼
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body, // Portal로 body 바로 아래 렌더링
  );
};

export default Modal;
