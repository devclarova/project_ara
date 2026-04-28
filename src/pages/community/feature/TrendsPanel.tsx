import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SeagullIcon from '@/components/common/SeagullIcon';
import { motion } from 'framer-motion';

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
    plan?: 'free' | 'basic' | 'premium';
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
  const { t, i18n } = useTranslation();
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
        const o = payload.old as import('@/types/database').Database['public']['Tables']['tweets']['Row'];
        const n = payload.new as import('@/types/database').Database['public']['Tables']['tweets']['Row'];
        if (
          o.like_count !== n.like_count ||
          o.reply_count !== n.reply_count ||
          o.view_count !== n.view_count ||
          (o as any).is_hidden !== (n as any).is_hidden
        ) {
          fetchTrendingTweets();
        }
      })
      .subscribe();

    const profileChannel = supabase
      .channel('profile-sync-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const updatedProfile = payload.new as import('@/types/database').Database['public']['Tables']['profiles']['Row'];

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
    <div className="pt-4 pb-0">
      {/* 🔍 서치바 */}
      {showSearchBar && (
        <div className="pb-2">
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
      <div className="space-y-3">
          <div className="bg-white rounded-[2rem] p-3.5 shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-secondary">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex justify-center items-center gap-2">
              <i className="ri-fire-fill text-orange-500 animate-pulse" />
              {t('trending.title')}
            </h2>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                ))}
              </div>
            ) : trendingTweets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('trending.no_trending', 'No trending tweets yet')}</p>
            ) : (
              <div className="space-y-2">
                {trendingTweets.map((tweet) => {
                  const isPremium = tweet.profiles?.plan === 'premium';
                  
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
                      className="group flex items-start gap-3 p-2.5 rounded-2xl transition-all cursor-pointer border border-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-100 dark:hover:border-white/10"
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
                        className="flex-shrink-0 pt-0.5 relative"
                      >
                        <div className={`${isPremium ? 'rounded-full p-[2px] bg-gradient-to-br from-[#00E5FF] via-[#00BFA5] to-[#00796B] shadow-[0_2px_10px_rgba(0,191,165,0.4)]' : ''}`}>
                          <Avatar className={`w-9 h-9 border ${isPremium ? 'border-white dark:border-background' : 'border-black/5 dark:border-white/10'}`}>
                            <AvatarImage
                              src={tweet.profiles?.avatar_url || '/default-avatar.svg'}
                              alt={tweet.profiles?.nickname || t('common.user', 'User')}
                            />
                            <AvatarFallback>
                              {tweet.profiles?.nickname
                                ? tweet.profiles.nickname.charAt(0).toUpperCase()
                                : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        {isPremium && (
                          <div className="absolute -top-1.5 -left-1.5 z-10 p-[2px] bg-white dark:bg-background rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.1)] transition-transform hover:scale-110 -rotate-12">
                            <div className="bg-gradient-to-br from-[#00E5FF] via-[#00BFA5] to-[#00796B] w-[15px] h-[15px] rounded-full flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]">
                              <SeagullIcon size={12} className="text-white drop-shadow-sm" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[10px] font-black uppercase tracking-tight text-gray-400 truncate">
                                {tweet.profiles?.nickname}
                              </span>
                            </div>
                            <p 
                              className={`text-[13px] leading-[1.4] break-keep ${
                                hasImageOnly 
                                  ? 'text-gray-500 dark:text-gray-400 font-normal italic' 
                                  : isPremium 
                                    ? 'text-amber-900 dark:text-amber-100 font-bold line-clamp-2 drop-shadow-sm'
                                    : 'text-gray-800 dark:text-gray-200 font-medium line-clamp-2'
                              }`}
                            >
                              {hasImageOnly ? t('trending.shared_photo', 'Shared a photo') : textContent}
                            </p>
                          </div>
                          
                          {firstImg && (
                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border shadow-sm group-hover:shadow transition-all group-hover:scale-105 ${isPremium ? 'border-amber-400/50 shadow-amber-500/10' : 'border-black/5 dark:border-white/10'}`}>
                              <img 
                                src={firstImg} 
                                alt={t('common.thumbnail', 'thumbnail')} 
                                className="w-full h-full object-cover" 
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>

                        <div className={`flex gap-3 mt-1.5 text-xs font-medium ${isPremium ? 'text-amber-700/70 dark:text-amber-500/70' : 'text-gray-400 dark:text-gray-500'}`}>
                          <span className="flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                            <i className="ri-chat-3-line" />
                            {tweet.reply_count}
                          </span>
                          <span className="flex items-center gap-1 group-hover:text-red-500 transition-colors">
                            <i className="ri-heart-line" />
                            {tweet.like_count}
                          </span>
                          <span className="flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
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
