import type { PropsWithChildren } from 'react';
import React from 'react';

// 하단 버튼 타입 (이미 있으면 그대로 사용)
export type ModalButton = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
};

// ✅ Base props를 먼저 정의 (children 제외)
interface BaseModalProps {
  isOpen: boolean; // 모달 열림 여부
  title?: string; // 제목
  message?: string; // 본문 메시지 (children과 병행 가능)
  buttons?: ModalButton[]; // 하단 버튼들
  onClose: () => void; // 닫기 함수 - 선택 아님(모달 밖 클릭/ESC 등 필요)
}

// ✅ children을 합친 최종 Props
export type ModalProps = PropsWithChildren<BaseModalProps>;

// ✅ React.FC<ModalProps> 혹은 함수형 컴포넌트로 children 포함
const Modal: React.FC<ModalProps> = ({ isOpen, title, message, buttons, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        {title && <h3 className="modal-title">{title}</h3>}
        {message && <p className="modal-message">{message}</p>}
        {/* ⚡ children이 있으면 그걸 우선 랜더링 */}
        {children}

        {buttons && buttons.length > 0 && (
          <div className="modal-actions">
            {buttons.map((b, i) => (
              <button key={i} className={`btn ${b.variant ?? 'primary'}`} onClick={b.onClick}>
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
