import { supabase } from '@/lib/supabase';
import type {
  FeedItem,
  UIPost,
  UIReply,
  TweetQueryResponse,
  ReplyQueryResponse,
} from '@/types/sns';

const PAGE_SIZE = 10;

export const tweetService = {
  /**
   * Fetch tweets authored by a specific user
   */
  async getPosts(userId: string, page: number, blockedUserIds: string[] = []): Promise<UIPost[]> {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('tweets')
      .select(
        `id, content, image_url, created_at, deleted_at,
        reply_count, like_count, view_count,
        profiles:author_id (id, nickname, user_id, avatar_url, banned_until)`
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const tweets = (data as unknown as TweetQueryResponse[]) ?? [];

    return tweets
      .filter(t => !blockedUserIds.includes(t.profiles?.id ?? '')) // 필터링 (UUID 기준)
      .map(t => ({
      type: 'post',
      id: t.id,
      user: {
        id: t.profiles?.id ?? '00000000-0000-0000-0000-000000000000',
        name: t.profiles?.nickname ?? 'Unknown',
        username: t.profiles?.user_id ?? 'anonymous',
        avatar: t.profiles?.avatar_url ?? '/default-avatar.svg',
        banned_until: t.profiles?.banned_until ?? null,
      },
      content: t.content,
      image: t.image_url || undefined,
      timestamp: t.created_at,
      deleted_at: (t as any).deleted_at,
      stats: {
        replies: t.reply_count ?? 0,
        likes: t.like_count ?? 0,
        views: t.view_count ?? 0,
        retweets: 0,
      },
    }));
  },

  /**
   * Fetch replies authored by a specific user
   */
  async getReplies(userId: string, page: number, blockedUserIds: string[] = []): Promise<UIReply[]> {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('tweet_replies')
      .select(
        `id,
        content,
        created_at,
        deleted_at,
        tweet_id,
        parent_reply_id,
        root_reply_id,
        profiles:author_id (id, nickname, user_id, avatar_url, banned_until),
        tweet_replies_likes!left(count),
        tweets!left (
          content,
          author_id
        )`,
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const replies = (data as unknown as ReplyQueryResponse[]) ?? [];

    return replies
      .filter(r => !blockedUserIds.includes(r.profiles?.id ?? '')) // 필터링 (UUID 기준)
      .map(r => ({
      type: 'reply',
      id: r.id,
      tweetId: r.tweet_id,
      parent_reply_id: r.parent_reply_id ?? null,
      root_reply_id: r.root_reply_id ?? null,
      user: {
        id: r.profiles?.id ?? '00000000-0000-0000-0000-000000000000',
        name: r.profiles?.nickname ?? 'Unknown',
        username: r.profiles?.user_id ?? 'anonymous',
        avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
        banned_until: r.profiles?.banned_until ?? null,
      },
      content: r.content,
      parentTweet: r.tweets?.content, // for display context if needed
      timestamp: r.created_at,
      createdAt: r.created_at,
      deleted_at: (r as any).deleted_at,
      stats: {
        replies: 0,
        likes: Array.isArray(r.tweet_replies_likes) ? (r.tweet_replies_likes[0]?.count ?? 0) : 0,
        views: 0,
        retweets: 0,
      },
    } as UIReply));
  },

  /**
   * Fetch liked items (posts and replies) for a user
   * Handles the complex logic of fetching IDs first, merging, sorting, and then fetching details.
   */
  async getLikedItems(
    userId: string,
    page: number,
    cachedItems?: { type: 'post' | 'reply'; id: string; date: string; likedAt: string }[],
  ): Promise<{
    items: FeedItem[];
    allLikedItems: { type: 'post' | 'reply'; id: string; date: string; likedAt: string }[];
  }> {
    let allItems = cachedItems || [];

    // If no cache provided or it's the first page request and we want to refresh, fetch all IDs
    if (!cachedItems || cachedItems.length === 0) {
      // 1. Fetch Post Likes
      const { data: postLikes, error: pErr } = await supabase
        .from('tweet_likes')
        .select('tweet_id, created_at')
        .eq('user_id', userId);

      if (pErr) throw pErr;

      // 2. Fetch Reply Likes
      const { data: replyLikes, error: rErr } = await supabase
        .from('tweet_replies_likes')
        .select('reply_id, created_at')
        .eq('user_id', userId);

      if (rErr) throw rErr;

      const pItems = (postLikes || []).map((i: { tweet_id: string; created_at: string }) => ({
        type: 'post' as const,
        id: i.tweet_id,
        date: i.created_at,
        likedAt: i.created_at,
      }));

      const rItems = (replyLikes || []).map((i: { reply_id: string; created_at: string }) => ({
        type: 'reply' as const,
        id: i.reply_id,
        date: i.created_at,
        likedAt: i.created_at,
      }));

      // Merge and sort by liked time (descending)
      allItems = [...pItems, ...rItems].sort(
        (a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime(),
      );
    }

    const from = page * PAGE_SIZE;
    const sliceEnd = from + PAGE_SIZE;
    const currentSlice = allItems.slice(from, sliceEnd);

    if (currentSlice.length === 0) {
      return { items: [], allLikedItems: allItems };
    }

    const postIds = currentSlice.filter(i => i.type === 'post').map(i => i.id);
    const replyIds = currentSlice.filter(i => i.type === 'reply').map(i => i.id);

    // Parallel fetch details
    const queries = [];
    if (postIds.length > 0) {
        queries.push(
        supabase.from('tweets').select(`
            id, content, image_url, created_at, deleted_at,
            reply_count, like_count, view_count,
            profiles(id, nickname, user_id, avatar_url, banned_until)
        `).in('id', postIds)
        );
    }
    if (replyIds.length > 0) {
        queries.push(
        supabase.from('tweet_replies').select(`
            id, content, created_at, tweet_id, deleted_at, parent_reply_id, root_reply_id,
            profiles(id, nickname, user_id, avatar_url, banned_until),
            tweet_replies_likes(count),
            tweets(content, author_id)
        `).in('id', replyIds)
        );
    }

    const results = await Promise.all(queries);

    let fetchedPosts: TweetQueryResponse[] = [];
    let fetchedReplies: ReplyQueryResponse[] = [];

    // Assign results correctly based on initial checks
    if (postIds.length > 0) {
      const res = results.shift();
      if (res?.error) throw res.error;
      fetchedPosts = (res?.data as unknown as TweetQueryResponse[]) ?? [];
    }
    if (replyIds.length > 0) {
      const res = results.shift();
      if (res?.error) throw res.error;
      fetchedReplies = (res?.data as unknown as ReplyQueryResponse[]) ?? [];
    }

    // Map back to FeedItem maintaining sort order
    const mappedItems = currentSlice
      .map(item => {
        if (item.type === 'post') {
          const p = fetchedPosts.find(x => x.id === item.id);
          if (!p) return null;
          return {
            type: 'post',
            id: p.id,
            liked_at: item.likedAt,
            user: {
            id: p.profiles?.id ?? '00000000-0000-0000-0000-000000000000',
            name: p.profiles?.nickname ?? 'Unknown',
            username: p.profiles?.user_id ?? 'anonymous',
            avatar: p.profiles?.avatar_url ?? '/default-avatar.svg',
            banned_until: p.profiles?.banned_until ?? null,
            },
            content: p.content,
            image: p.image_url,
            timestamp: p.created_at,
            deleted_at: (p as any).deleted_at,
            stats: {
              replies: p.reply_count ?? 0,
              likes: p.like_count ?? 0,
              views: p.view_count ?? 0,
              retweets: 0,
            },
            liked: true,
          } as UIPost;
        } else {
          const r = fetchedReplies.find(x => x.id === item.id);
          if (!r) return null;
          return {
            type: 'reply',
            id: r.id,
            tweetId: r.tweet_id,
            parent_reply_id: r.parent_reply_id ?? null,
            root_reply_id: r.root_reply_id ?? null,
            liked_at: item.likedAt,
            user: {
            id: r.profiles?.id ?? '00000000-0000-0000-0000-000000000000',
            name: r.profiles?.nickname ?? 'Unknown',
            username: r.profiles?.user_id ?? 'anonymous',
            avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
            banned_until: r.profiles?.banned_until ?? null,
            },
            content: r.content,
            parentTweet: r.tweets?.content,
            timestamp: r.created_at,
            createdAt: r.created_at,
            deleted_at: (r as any).deleted_at,
            stats: {
              replies: 0,
              likes: r.tweet_replies_likes?.[0]?.count ?? 0,
              views: 0,
              retweets: 0,
            },
            liked: true,
          } as UIReply;
        }
      })
      .filter((item): item is FeedItem => item !== null);

    return { items: mappedItems, allLikedItems: allItems };
  },

  /**
   * Fetch a single tweet by ID
   */
  async getTweetById(tweetId: string): Promise<UIPost | null> {
    const { data, error } = await supabase
      .from('tweets')
      .select(
        `
        id, content, image_url, created_at, updated_at, deleted_at,
        reply_count, repost_count, like_count, bookmark_count, view_count,
        profiles (id, nickname, user_id, avatar_url, banned_until)
      `
      )
      .eq('id', tweetId)
      .single();

    if (error) {
      return null;
    }

    const tweet = data as unknown as TweetQueryResponse;
    const createdAt = tweet.created_at;

    return {
      type: 'tweet',
      id: tweet.id,
      user: {
        id: tweet.profiles?.id ?? '00000000-0000-0000-0000-000000000000',
        name: tweet.profiles?.nickname ?? 'Unknown',
        username: tweet.profiles?.user_id ?? 'anonymous',
        avatar: tweet.profiles?.avatar_url ?? '/default-avatar.svg',
        banned_until: tweet.profiles?.banned_until ?? null,
      },
      content: tweet.content,
      image: tweet.image_url,
      deleted_at: (tweet as any).deleted_at,

      timestamp: tweet.created_at,
      createdAt,
      updatedAt: (tweet as any).updated_at ?? undefined,
      stats: {
        replies: tweet.reply_count ?? 0,
        retweets: tweet.repost_count ?? 0,
        likes: tweet.like_count ?? 0,
        bookmarks: tweet.bookmark_count ?? 0,
        views: tweet.view_count ?? 0,
      },
    } as UIPost;
  },

  /**
   * Fetch replies for a specific tweet
   * supports pagination or loading all (for jumping to a comment)
   */
  async getRepliesByTweetId(tweetId: string, page: number, loadAll = false): Promise<UIReply[]> {
    let query = supabase
      .from('tweet_replies')
      .select(
        `id, content, created_at, deleted_at, parent_reply_id, root_reply_id, profiles:author_id (id, nickname, user_id, avatar_url, banned_until), tweet_replies_likes (count)`,
      )
      .eq('tweet_id', tweetId)
      .order('created_at', { ascending: true });

    if (!loadAll) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);
    } else {
      // jump-to-comment 시에는 잘리지 않도록 높은 한도 설정 (기본 1000개 제한 방지)
      query = query.limit(5000);
    }

    const { data, error } = await query;
    if (error) throw error;

    const replies = (data as unknown as ReplyQueryResponse[]) ?? [];

    return replies.map(
      r =>
        ({
          type: 'reply',
          id: r.id,
          tweetId,
          parent_reply_id: r.parent_reply_id ?? null,
          root_reply_id: r.root_reply_id ?? null,
          user: {
            id: r.profiles?.id ?? '00000000-0000-0000-0000-000000000000',
            name: r.profiles?.nickname ?? 'Unknown',
            username: r.profiles?.user_id ?? 'anonymous',
            avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
            banned_until: r.profiles?.banned_until ?? null,
          },
          content: r.content,
          deleted_at: (r as any).deleted_at,

          timestamp: r.created_at,
          createdAt: r.created_at, // for sorting
          stats: {
            replies: 0,
            retweets: 0,
            likes: Array.isArray(r.tweet_replies_likes)
              ? (r.tweet_replies_likes[0]?.count ?? 0)
              : 0,
            views: 0,
          },
        }) as UIReply,
    );
  },

  /**
   * Fetch replies for a specific parent reply
   * Kept from jh-93 just in case, though main might handle nesting via parent_reply_id in getAll
   */
  async getRepliesByParentId(parentId: string): Promise<UIReply[]> {
    const { data, error } = await supabase
      .from('tweet_replies')
      .select(
        `id, content, created_at, tweet_id, deleted_at, parent_reply_id, root_reply_id, profiles:author_id (id, nickname, user_id, avatar_url, banned_until), tweet_replies_likes (count)`,
      )
      .eq('parent_reply_id', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const replies = (data as unknown as ReplyQueryResponse[]) ?? [];

    return replies.map(r => ({
      type: 'reply',
      id: r.id,
      tweetId: r.tweet_id,
      parent_reply_id: r.parent_reply_id ?? null,
      root_reply_id: r.root_reply_id ?? null,
      user: {
        id: r.profiles?.id ?? '00000000-0000-0000-0000-000000000000',
        name: r.profiles?.nickname ?? 'Unknown',
        username: r.profiles?.user_id ?? 'anonymous',
        avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
        banned_until: r.profiles?.banned_until ?? null,
      },
      content: r.content,
      deleted_at: (r as any).deleted_at,

      timestamp: r.created_at,
      createdAt: r.created_at,
      stats: {
        replies: 0,
        retweets: 0,
        likes: Array.isArray(r.tweet_replies_likes) ? (r.tweet_replies_likes[0]?.count ?? 0) : 0,
        views: 0,
      },
    } as UIReply));
  }
};
