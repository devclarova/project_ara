import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
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
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  hideSearchBar?: boolean;
};

export default function TrendsPanel({
  searchQuery = '',
  onSearchChange,
  hideSearchBar = false,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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

    const profileChannel = supabase
      .channel('profiles-update-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const updatedProfile = payload.new as any;

        setTrendingTweets(prev => {
          const hasProfile = prev.some(t => t.profiles?.nickname === updatedProfile.nickname);
          if (hasProfile) {
            fetchTrendingTweets();
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(profileChannel);
    };
  }, []);

  const showSearchBar = !hideSearchBar && !!onSearchChange;

  return (
    <div className="w-80 lg:px-4 py-6">
      {/* 🔍 서치바 */}
      {showSearchBar && (
        <div className="pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400 dark:text-gray-500 text-sm" />
            </div>
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:text-gray-300 dark:bg-secondary rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
            />
          </div>
        </div>
      )}

      {/* 실시간 인기 피드 카드 영역 */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-secondary">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex justify-center items-center gap-2">
            {t('trending.title')}
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          ) : trendingTweets.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No trending tweets yet</p>
          ) : (
            <div className="space-y-2">
              {trendingTweets.map(tweet => {
                // HTML 파싱하여 텍스트와 이미지 추출
                const parser = new DOMParser();
                const doc = parser.parseFromString(tweet.content, 'text/html');
                const firstImg = doc.querySelector('img')?.src;
                const textContent = (doc.body.textContent || '').trim();
                const hasImageOnly = !textContent && !!firstImg;

                return (
                  <div
                    key={tweet.id}
                    onClick={() => {
                      const target = `/sns/${tweet.id}`;
                      if (location.pathname !== target) {
                        navigate(target);
                      }
                    }}
                    className="group flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/10"
                  >
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        if (tweet.profiles?.nickname) {
                          const target = `/profile/${encodeURIComponent(tweet.profiles.nickname)}`;
                          if (location.pathname !== target) {
                            navigate(target);
                          }
                        }
                      }}
                      className="flex-shrink-0 pt-0.5"
                    >
                      <Avatar className="w-9 h-9 border border-black/5 dark:border-white/10">
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
                      <div className="flex justify-between items-start gap-3">
                        <p 
                          className={`text-[13px] leading-[1.4] break-keep ${
                            hasImageOnly 
                              ? 'text-gray-500 dark:text-gray-400 font-normal' 
                              : 'text-gray-800 dark:text-gray-200 font-medium line-clamp-2'
                          }`}
                        >
                          {hasImageOnly ? t('trending.shared_photo', '사진을 공유했습니다.') : textContent}
                        </p>
                        
                        {firstImg && (
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-black/5 dark:border-white/10 shadow-sm group-hover:shadow transition-all group-hover:scale-105">
                            <img 
                              src={firstImg} 
                              alt="thumbnail" 
                              className="w-full h-full object-cover" 
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                        <span className="flex items-center gap-1 group-hover:text-blue-500 transition-colors" title="Replies">
                          <i className="ri-chat-3-line" />
                          {tweet.reply_count}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-red-500 transition-colors" title="Likes">
                          <i className="ri-heart-line" />
                          {tweet.like_count}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-emerald-500 transition-colors" title="Views">
                          <i className="ri-eye-line" />
                          {tweet.view_count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
