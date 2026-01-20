import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type Recipient = {
  id: string;
  name: string;
  avatar?: string | null;
};

interface MessageButtonProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Recipient;
}

export default function MessageButton({ isOpen, onClose, recipient }: MessageButtonProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) setMessage('');
  }, [isOpen]);

  const handleSend = () => {
    // UI만: 실제 전송 로직은 나중에 연결
    toast.success(t('message.sent', '메시지 전송 UI 완료(임시)'));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={recipient.avatar ?? '/default-avatar.svg'} alt={recipient.name} />
              <AvatarFallback>{recipient.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="font-bold">{recipient.name}</span>
              <span className="text-sm text-muted-foreground">
                {t('message.send_to', '에게 메시지')}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 space-y-2">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t('message.placeholder', '메시지를 입력하세요')}
            className="min-h-[140px] resize-none rounded-xl"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('message.note', '상대에게 예의 있게 보내주세요')}</span>
            <span>{message.length.toLocaleString()}/500</span>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-full px-5">
            {t('common.cancel', '취소')}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="rounded-full px-6 bg-gradient-to-r from-[#00dbaa] to-[#009e89] text-white hover:opacity-90"
          >
            <span className="flex items-center gap-2">
              <i className="ri-send-plane-2-line" />
              {t('message.send', '보내기')}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
