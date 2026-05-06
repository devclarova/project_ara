import React from 'react';
import Modal from './Modal';
import InquiryView from '@/components/settings/InquiryView';
import { useTranslation } from 'react-i18next';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InquiryModal({ isOpen, onClose }: InquiryModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="1:1 문의하기"
      className="max-w-[480px]"
      contentClassName="flex-1 min-h-0 bg-white dark:bg-secondary overflow-hidden relative flex flex-col"
    >
      <InquiryView onClose={onClose} />
    </Modal>
  );
}
