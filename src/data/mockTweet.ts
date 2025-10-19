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

export interface Tweet {
  id: string
  author: string
  handle: string
  avatar: string
  content: string
  image?: string
  stats: TweetStats
  replies: Reply[]
}

// mock 데이터 (트윗 + 댓글)
export const mockTweet: Tweet = {
  id: "1",
  author: "Sarah Chen",
  handle: "sarahchen_dev",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  content:
    "Just shipped a new feature that reduces our app load time by 40%! Sometimes the smallest optimizations make the biggest difference. 🚀 #WebDev #Performance",
  image:
    "https://picsum.photos/seed/performance/600/340",
  stats: {
    reposts: 87,
    quotes: 12,
    likes: 342,
    bookmarks: 18,
  },
  replies: [
    {
      id: "r1",
      author: "Michael Chen",
      handle: "michaelchen_dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      time: "1h",
      content:
        "This is amazing! What specific optimizations did you implement? I'm always looking for ways to improve performance.",
      likes: 24,
      retweets: 8,
      comments: 3,
    },
    {
      id: "r2",
      author: "Lisa Rodriguez",
      handle: "lisarodriguez_tech",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
      time: "45m",
      content:
        "Incredible work! 40% improvement is substantial. Performance optimization often makes such a huge difference in UX. 👏",
      likes: 67,
      retweets: 12,
      comments: 1,
    },
    {
      id: "r3",
      author: "James Wilson",
      handle: "jameswilson_eng",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
      time: "30m",
      content:
        "Love seeing performance wins like this! Was it mainly frontend optimizations or backend work too?",
      likes: 18,
      retweets: 5,
      comments: 2,
    },
    {
      id: "r4",
      author: "Emma Thompson",
      handle: "emmathompson_pm",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      time: "15m",
      content:
        "Fast loading times make a world of difference. Would love to see a blog post about your optimization process!",
      likes: 9,
      retweets: 3,
      comments: 0,
    },
  ],
}
