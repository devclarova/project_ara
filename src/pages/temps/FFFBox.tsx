import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Profile } from '@/types/database';
import FFFTweetComposer from './FFFTweetComposer';

interface FFFBoxProps {
  profile: Profile | null;
  onPost?: (newTweet: any) => void;
}

const FFFBox = ({ profile, onPost }: FFFBoxProps) => {
  const [showComposer, setShowComposer] = useState(false);

  const handlePost = (newTweet: any) => {
    onPost?.(newTweet); // ✅ 부모로 전달
    setShowComposer(false); // ✅ 게시 후 닫기
  };

  return (
    <div className="card border rounded-xl p-4 bg-white shadow-sm sticky top-0 z-20">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          새 글 작성
          {profile?.nickname && (
            <span className="ml-2 text-gray-500 text-sm">- {profile.nickname}</span>
          )}
        </h2>
        <Button onClick={() => setShowComposer(prev => !prev)} className="bg-primary text-white">
          {showComposer ? '닫기' : '작성하기'}
        </Button>
      </div>

      {showComposer && (
        <div className="mt-4 border-t pt-4">
          <FFFTweetComposer onPost={handlePost} />
        </div>
      )}
    </div>
  );
};

export default FFFBox;
