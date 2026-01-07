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
  async getPosts(userId: string, page: number): Promise<UIPost[]> {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('tweets')
      .select(
        `id, content, image_url, created_at,
        reply_count, like_count, view_count,
        profiles:author_id (nickname, user_id, avatar_url)`,
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const tweets = (data as unknown as TweetQueryResponse[]) ?? [];

    return tweets.map(t => ({
      type: 'post',
      id: t.id,
      user: {
        name: t.profiles?.nickname ?? 'Unknown',
        username: t.profiles?.user_id ?? 'anonymous',
        avatar: t.profiles?.avatar_url ?? '/default-avatar.svg',
      },
      content: t.content,
      image: t.image_url || undefined,
      timestamp: t.created_at,
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
  async getReplies(userId: string, page: number): Promise<UIReply[]> {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('tweet_replies')
      .select(
        `id,
        content,
        created_at,
        tweet_id,
        profiles:author_id (nickname, user_id, avatar_url),
        tweet_replies_likes!left(count),
        tweets!inner (
          content,
          author_id
        )`,
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const replies = (data as unknown as ReplyQueryResponse[]) ?? [];

    return replies.map(r => ({
      type: 'reply',
      id: r.id,
      tweetId: r.tweet_id,
      user: {
        name: r.profiles?.nickname ?? 'Unknown',
        username: r.profiles?.user_id ?? 'anonymous',
        avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
      },
      content: r.content,
      parentTweet: r.tweets?.content, // for display context if needed
      timestamp: r.created_at,
      createdAt: r.created_at,
      stats: {
        replies: 0,
        likes: Array.isArray(r.tweet_replies_likes) ? (r.tweet_replies_likes[0]?.count ?? 0) : 0,
        views: 0,
        retweets: 0,
      },
    }));
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
        supabase
          .from('tweets')
          .select(
            `
            id, content, image_url, created_at,
            reply_count, like_count, view_count,
            profiles(nickname, user_id, avatar_url)
        `,
          )
          .in('id', postIds),
      );
    }
    if (replyIds.length > 0) {
      queries.push(
        supabase
          .from('tweet_replies')
          .select(
            `
            id, content, created_at, tweet_id,
            profiles(nickname, user_id, avatar_url),
            tweet_replies_likes(count),
            tweets(content, author_id)
        `,
          )
          .in('id', replyIds),
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
              name: p.profiles?.nickname ?? 'Unknown',
              username: p.profiles?.user_id ?? 'anonymous',
              avatar: p.profiles?.avatar_url ?? '/default-avatar.svg',
            },
            content: p.content,
            image: p.image_url,
            timestamp: p.created_at,
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
            liked_at: item.likedAt,
            user: {
              name: r.profiles?.nickname ?? 'Unknown',
              username: r.profiles?.user_id ?? 'anonymous',
              avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
            },
            content: r.content,
            parentTweet: r.tweets?.content,
            timestamp: r.created_at,
            createdAt: r.created_at,
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
        id, content, image_url,  created_at, updated_at,
        reply_count, repost_count, like_count, bookmark_count, view_count,
        profiles (nickname, user_id, avatar_url)
      `,
      )
      .eq('id', tweetId)
      .single();

    if (error) {
      // It's common for a tweet to not be found (deleted), so we might simply return null or throw depending on usage.
      // The original code handled it by showing a toast and redirecting.
      // Here we return null so the component can decide.
      return null;
    }

    const tweet = data as unknown as TweetQueryResponse;
    const createdAt = tweet.created_at;

    return {
      type: 'tweet',
      id: tweet.id,
      user: {
        name: tweet.profiles?.nickname ?? 'Unknown',
        username: tweet.profiles?.user_id ?? 'anonymous',
        avatar: tweet.profiles?.avatar_url ?? '/default-avatar.svg',
      },
      content: tweet.content,
      image: tweet.image_url,
      createdAt,
      updatedAt: tweet.updated_at ?? undefined,
      timestamp: createdAt,
      // timestamp: new Date(tweet.created_at).toLocaleString('ko-KR', {
      //   hour: '2-digit',
      //   minute: '2-digit',
      //   month: 'short',
      //   day: 'numeric',
      // }),
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
        `id, content, created_at, profiles:author_id (nickname, user_id, avatar_url), tweet_replies_likes (count), parent_reply_id, root_reply_id`,
      )
      .eq('tweet_id', tweetId)
      .order('created_at', { ascending: true });

    if (!loadAll) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);
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
            name: r.profiles?.nickname ?? 'Unknown',
            username: r.profiles?.user_id ?? 'anonymous',
            avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
          },
          content: r.content,
          // timestamp: new Date(r.created_at).toLocaleString('ko-KR', {
          //   hour: '2-digit',
          //   minute: '2-digit',
          //   month: 'short',
          //   day: 'numeric',
          // }),
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
};
