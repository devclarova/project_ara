import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify'; // ✅ 추가

interface User {
  name: string;
  username: string;
  avatar: string;
}

interface Stats {
  comments: number;
  retweets: number;
  likes: number;
  views: number;
}

interface Reply {
  id: string;
  tweetId: string;
  user: User;
  content: string;
  timestamp: string;
  stats: Stats;
}

interface ReplyListProps {
  replies: Reply[];
}

function ReplyCard({ reply }: { reply: Reply }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to user's profile page
    navigate(`/finalhome/user/${reply.user.name}`);
  };

  return (
    <div className="border-b border-gray-200 px-4 py-3 hover:bg-gray-50/50 transition-colors">
      <div className="flex space-x-3">
        <div onClick={handleAvatarClick} className="cursor-pointer">
          {/* <Avatar src={reply.user.avatar} alt={reply.user.name} size="md" /> */}
          <Avatar>
            <AvatarImage src={reply.user.avatar || '/default-avatar.svg'} alt={reply.user.name} />
            <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center space-x-1 flex-wrap">
            <span
              className="font-bold text-gray-900 hover:underline cursor-pointer truncate"
              onClick={handleAvatarClick}
            >
              {reply.user.name}
            </span>
            <span className="text-gray-500 truncate">@{reply.user.username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 flex-shrink-0">{reply.timestamp}</span>
          </div>

          {/* Reply Content */}
          <div className="mt-1">
            <div
              className="text-gray-900 whitespace-pre-wrap break-words leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(reply.content, {
                  ADD_TAGS: ['iframe', 'video', 'source', 'img'],
                  ADD_ATTR: [
                    'allow',
                    'allowfullscreen',
                    'frameborder',
                    'scrolling',
                    'src',
                    'controls',
                  ],
                }),
              }}
            />
          </div>
          {/* Action Buttons */}
          <div className="flex items-center justify-between max-w-md mt-3 text-gray-500">
            {/* Reply */}
            <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i className="ri-chat-3-line text-lg"></i>
              </div>
              <span className="text-sm">{reply.stats.comments}</span>
            </button>

            {/* Retweet */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                retweeted ? 'text-green-500' : 'hover:text-green-500'
              }`}
              onClick={e => {
                e.stopPropagation();
                setRetweeted(!retweeted);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                <i className="ri-repeat-line text-lg"></i>
              </div>
              <span className="text-sm">{reply.stats.retweets + (retweeted ? 1 : 0)}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                liked ? 'text-red-500' : 'hover:text-red-500'
              }`}
              onClick={e => {
                e.stopPropagation();
                setLiked(!liked);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`}></i>
              </div>
              <span className="text-sm">{reply.stats.likes + (liked ? 1 : 0)}</span>
            </button>

            {/* Views */}
            <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i className="ri-bar-chart-line text-lg"></i>
              </div>
              <span className="text-sm">{reply.stats.views}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReplyList({ replies }: ReplyListProps) {
  if (replies.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <i className="ri-chat-3-line text-4xl mb-2 block"></i>
        <p>No replies yet</p>
        <p className="text-sm mt-1">Be the first to reply!</p>
      </div>
    );
  }

  return (
    <div>
      {replies.map(reply => (
        <ReplyCard key={reply.id} reply={reply} />
      ))}
    </div>
  );
}
