// src/pages/homes/feature/TrendsPanel.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

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

export default function TrendsPanel() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTweets, setTrendingTweets] = useState<TrendingTweet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendingTweets = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trending_tweets');
      if (error) throw error;
      if (!Array.isArray(data)) return;
      setTrendingTweets(data);
    } catch (err) {
      console.error('🔥 인기 트윗 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTweets();

    const subscription = supabase
      .channel('trending-tweets-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const oldData = payload.old as any;
        const newData = payload.new as any;
        if (
          oldData.like_count !== newData.like_count ||
          oldData.reply_count !== newData.reply_count ||
          oldData.view_count !== newData.view_count
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
    <div className="w-80 h-full flex flex-col  lg:px-4 py-6">
      {/* 🔍 Search Bar */}
      <div className="sticky top-0 bg-white z-10 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="ri-search-line text-gray-400 text-sm"></i>
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

      {/* 🧾 What's happening */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex justify-center items-center gap-2">
            실시간 인기 피드
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          ) : trendingTweets.length === 0 ? (
            <p className="text-gray-500 text-sm">No trending tweets yet</p>
          ) : (
            <div className="space-y-2">
              {trendingTweets.map(tweet => (
                <div
                  key={tweet.id}
                  onClick={() => navigate(`/finalhome/${tweet.id}`)}
                  className="group flex items-start gap-3 p-2 rounded-xl hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <img
                    src={tweet.profiles?.avatar_url || '/default-avatar.svg'}
                    onError={e => (e.currentTarget.src = '/default-avatar.svg')}
                    alt={tweet.profiles?.nickname || 'User'}
                    className="w-9 h-9 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-3 leading-snug">
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

          {/* Show more */}
          {/* <button className="w-full text-center text-primary hover:bg-primary/10 rounded-full py-2 font-medium transition-colors mt-3">
            Show more
          </button> */}
        </div>
      </div>
    </div>
  );
}
