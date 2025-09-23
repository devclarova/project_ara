import { createPortal } from 'react-dom';
import closeIcon from '../assets/close.svg';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, isOpen, onClose, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  // 추가한 부분
  const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;
  if (!modalRoot) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <img className={styles.closeButton} src={closeIcon} alt="close" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>,
    modalRoot,
  );
}

export default Modal;
