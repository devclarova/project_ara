import type { UITweet } from '@/types/sns';

// 전역 캐시 변수
let feedCache: UITweet[] | null = null;
let hasMoreCache = true;
let pageCache = 0;
let lastTweetIdCache: string | null = null;
let scrollYCache = 0;

export const SnsStore = {
  getFeed: () => feedCache,
  setFeed: (feed: UITweet[]) => {
    feedCache = feed;
  },
  updateTweet: (tweetId: string, updates: Partial<UITweet> | ((prev: UITweet) => UITweet)) => {
    if (!feedCache) return;
    feedCache = feedCache.map(t => {
      if (t.id === tweetId) {
        if (typeof updates === 'function') {
          return updates(t);
        }
        return { ...t, ...updates };
      }
      return t;
    });
  },
  
  // 좋아요 수 등 stats만 업데이트하는 헬퍼
  updateStats: (tweetId: string, statsUpdates: Partial<UITweet['stats']>) => {
    if (!feedCache) return;
    feedCache = feedCache.map(t => {
      if (t.id === tweetId) {
        return {
          ...t,
          stats: { ...t.stats, ...statsUpdates },
        };
      }
      return t;
    });
  },

  getHasMore: () => hasMoreCache,
  setHasMore: (val: boolean) => { hasMoreCache = val; },

  getPage: () => pageCache,
  setPage: (val: number) => { pageCache = val; },

  getScrollY: () => scrollYCache,
  setScrollY: (val: number) => { scrollYCache = val; },

  getLastTweetId: () => lastTweetIdCache,
  setLastTweetId: (id: string | null) => { lastTweetIdCache = id; },
  
  clear: () => {
    feedCache = null;
    hasMoreCache = true;
    pageCache = 0;
    lastTweetIdCache = null;
    scrollYCache = 0;
  }
};
