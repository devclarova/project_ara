// src/data/mockTweet.ts
export interface Reply {
  id: string
  author: string
  handle: string
  avatar: string
  time: string
  content: string
  likes: number
  retweets: number
  comments: number
}

export interface TweetStats {
  reposts: number
  quotes: number
  likes: number
  bookmarks: number
}

// export interface Tweet {
//   id: string
//   author: string
//   handle: string
//   avatar: string
//   content: string
//   image?: string
//   stats: TweetStats
//   replies: Reply[]
//   created_at: string
// }

export interface Tweet {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  repost_count: number;
  bookmark_count: number;
  profiles: { nickname: string; avatar_url: string } | null;
}

export const mockTweets: Tweet[] = [
  // {
  //   id: '1',
  //   author: 'Sarah Chen',
  //   handle: 'sarahchen_dev',
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  //   content:
  //     'Just shipped a new feature that reduces our app load time by 40%! 🚀 #WebDev #Performance',
  //   image: 'https://picsum.photos/seed/performance/600/340',
  //   stats: { reposts: 87, quotes: 12, likes: 342, bookmarks: 18 },
  //   replies: [],
  //   created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  // },
  // {
  //   id: '2',
  //   author: 'Marcus Rivera',
  //   handle: 'marcusdesigns',
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
  //   content:
  //     "The future of design isn't just about looks — it's about crafting experiences that solve real problems.",
  //   image: 'https://picsum.photos/seed/design/600/340',
  //   stats: { reposts: 53, quotes: 8, likes: 1240, bookmarks: 42 },
  //   replies: [],
  //   created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  // },
]
