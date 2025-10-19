import React from 'react';
import ReplyCard from './ReplyCard';

interface Reply {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  replies: number;
  retweets: number;
}

interface RepliesListProps {
  replies: Reply[];
}

const RepliesList = ({ replies }: RepliesListProps) => {
  if (!replies || replies.length === 0) {
    return (
      <div className="p-6 text-center text-secondary">
        <p>No replies yet. Be the first to reply!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {replies.map(reply => (
        <ReplyCard key={reply.id} {...reply} />
      ))}
    </div>
  );
};

export default RepliesList;
