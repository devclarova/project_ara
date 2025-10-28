import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Profile } from '@/types/database';
import FFFTweetComposer from './FFFTweetComposer';

interface FFFBoxProps {
  profile: Profile | null;
  onPost?: (newTweet: any) => void;
}

const FFFBox = ({ profile, onPost }: FFFBoxProps) => {
  const [open, setOpen] = useState(false);

  const handlePost = async (newTweet: any) => {
    onPost?.(newTweet);
    setOpen(false); // ✅ 게시 후 모달 닫기
  };

  return (
    <div className="sticky top-0 z-20 rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-sm p-5">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          새 글 작성
          {profile?.nickname && (
            <span className="ml-2 text-muted-foreground text-sm">- {profile.nickname}</span>
          )}
        </h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              작성하기
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>새 글 작성하기</DialogTitle>
            </DialogHeader>

            <FFFTweetComposer onPost={handlePost} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FFFBox;
