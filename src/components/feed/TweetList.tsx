// src/components/TweetList.tsx
import type { Tweet } from '../../data/mockTweet';
import TweetCard from './TweetCard';

interface TweetListProps {
  tweets: Tweet[];
}

export default function TweetList({ tweets }: TweetListProps) {
  if (!tweets || tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p className="text-lg font-medium">아직 트윗이 없습니다</p>
        <p className="text-sm text-gray-400 mt-1">첫 트윗을 작성해보세요 🐦</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {tweets.map(tweet => (
        <TweetCard key={tweet.id} {...tweet} />
      ))}
    </div>
  );
}
