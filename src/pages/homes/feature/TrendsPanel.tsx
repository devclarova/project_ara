import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TrendingTweet {
  id: string;
  content: string;
  like_count: number;
  reply_count: number;
  view_count: number;
  created_at: string;
  profiles: {
    nickname: string;
    avatar_url: string | null;
  } | null;
}

type Props = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

export default function TrendsPanel({ searchQuery, onSearchChange }: Props) {
  const navigate = useNavigate();
  const [trendingTweets, setTrendingTweets] = useState<TrendingTweet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendingTweets = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trending_tweets');
      if (error) throw error;
      if (!Array.isArray(data)) return;
      setTrendingTweets(data);
    } catch (err) {
      console.error('인기 트윗 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTweets();

    const subscription = supabase
      .channel('trending-tweets-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const o = payload.old as any;
        const n = payload.new as any;
        if (
          o.like_count !== n.like_count ||
          o.reply_count !== n.reply_count ||
          o.view_count !== n.view_count
        ) {
          fetchTrendingTweets();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="w-80 h-full flex flex-col lg:px-4 py-6">
      <div className="sticky top-0 bg-white dark:bg-background z-10 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="ri-search-line text-gray-400 dark:text-gray-500 text-sm"></i>
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-secondary rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-secondary">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex justify-center items-center gap-2">
            실시간 인기 피드
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          ) : trendingTweets.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No trending tweets yet</p>
          ) : (
            <div className="space-y-2">
              {trendingTweets.map(tweet => (
                <div
                  key={tweet.id}
                  onClick={() => navigate(`/finalhome/${tweet.id}`)}
                  className="group flex items-start gap-3 p-2 rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer"
                >
                  {/* ✅ 아바타 */}
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      if (tweet.profiles?.nickname) {
                        navigate(`/finalhome/user/${encodeURIComponent(tweet.profiles.nickname)}`);
                      }
                    }}
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage
                        src={tweet.profiles?.avatar_url || '/default-avatar.svg'}
                        alt={tweet.profiles?.nickname || 'User'}
                      />
                      <AvatarFallback>
                        {tweet.profiles?.nickname
                          ? tweet.profiles.nickname.charAt(0).toUpperCase()
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-3 leading-snug">
                      {tweet.content.replace(/<[^>]*>?/gm, '')}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1" title="Replies">
                        <i className="ri-chat-3-line text-blue-500"></i>
                        {tweet.reply_count}
                      </span>
                      <span className="flex items-center gap-1" title="Likes">
                        <i className="ri-heart-line text-red-500"></i>
                        {tweet.like_count}
                      </span>
                      <span className="flex items-center gap-1" title="Views">
                        <i className="ri-eye-line text-emerald-500"></i>
                        {tweet.view_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
