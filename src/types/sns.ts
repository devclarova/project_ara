export type TweetUser = {
  id: string; // profiles.id (UUID)
  name: string;
  username: string;
  avatar: string;
  banned_until?: string | null;
};

// DB Row Types (Manual definition since database.ts is incomplete)
export interface DBProfile {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
}

export interface TweetQueryResponse {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  reply_count: number;
  like_count: number;
  view_count: number;
  repost_count?: number;
  bookmark_count?: number;
  profiles: {
    id: string;
    nickname: string;
    user_id: string;
    avatar_url: string | null;
    banned_until?: string | null;
  } | null;
}

export interface ReplyQueryResponse {
  id: string;
  content: string;
  created_at: string;
  tweet_id: string;
  parent_reply_id?: string | null;
  root_reply_id?: string | null;
  profiles: {
    id: string;
    nickname: string;
    user_id: string;
    avatar_url: string | null;
    banned_until?: string | null;
  } | null;
  tweet_replies_likes?: { count: number }[];
  tweets?: {
    content: string;
    author_id: string;
  } | null;
}

export type TweetStats = {
  replies: number;
  retweets: number;
  likes: number;
  bookmarks?: number;
  views: number;
}; // Keeping existing TweetStats export



export interface BaseFeedItem {
  id: string;
  user: TweetUser;
  content: string;
  image?: string | string[];
  timestamp: string;
  createdAt?: string;
  stats: TweetStats;
  liked?: boolean;
  liked_at?: string; // For 'likes' tab sorting
  deleted_at?: string | null; // Soft delete timestamp
  // 10-zzeon compatibility
  parent_reply_id?: string | null;
  root_reply_id?: string | null;
}

export interface UIPost extends BaseFeedItem {
  type?: 'tweet' | 'post'; // 'post' is used in ProfileTweets, 'tweet' is default
}

export interface UIReply extends BaseFeedItem {
  type: 'reply';
  tweetId: string;
  parentTweet?: string;
  parent_reply_id?: string | null;
  root_reply_id?: string | null;
}

export type FeedItem = UIPost | UIReply;

// For backward compatibility if needed, or alias
export type UITweet = UIPost;
