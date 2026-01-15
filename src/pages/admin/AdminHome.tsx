import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Activity, 
  TrendingUp,
  DollarSign,
  MoreVertical,
  CreditCard,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UserProfileModal from './components/UserProfileModal';
import { usePresence } from '@/contexts/PresenceContext';

interface DashboardStats {
  total_users: number;
  online_users: number;
  new_users_7d: number;
  user_growth_pct: number;
  pending_reports: number;
  total_revenue: number;
  subscription_revenue: number;
  shop_revenue: number;
  daily_trends: { date: string; count: number }[];
  recent_users: {
    id: string;
    profile_id: string;
    nickname: string;
    avatar_url: string | null;
    banner_url: string | null;
    email: string;
    is_admin: boolean;
    is_online: boolean;
    last_active_at: string;
    last_sign_in_at: string | null;
    created_at: string;
    bio: string | null;
    location: string | null;
    gender: string | null;
    birthday: string | null;
    banned_until: string | null;
    followers_count: number;
    following_count: number;
    country: string | null;
    country_name: string | null;
    country_flag_url: string | null;
  }[];
}

const AdminHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueType, setRevenueType] = useState<'total' | 'subscription' | 'shop'>('total');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { onlineUsers, dbOnlineUsers } = usePresence();

  // Helper to determine real-time online status
  const isUserOnline = (user: any) => {
    // 1. Check real-time DB updates first (Most authoritative for explicit changes)
    if (user.profile_id && user.profile_id in dbOnlineUsers) return dbOnlineUsers[user.profile_id];
    if (user.id in dbOnlineUsers) return dbOnlineUsers[user.id];

    // 2. Check presence channel (Active connection)
    if (onlineUsers.has(user.id)) return true;

    // 3. ✨ CRITICAL FIX: If Presence is active (we have >0 users) but this user is NOT in it,
    //    they are OFFLINE. Ignore stale 'user.is_online' from initial load.
    if (onlineUsers.size > 0) return false;

    // 4. Fallback to initial DB data ONLY if Presence system isn't monitoring anyone yet (e.g. init)
    return user.is_online;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        if (error) {
          console.error('RPC Error:', error);
          if (error.code === 'PGRST202') {
            toast.error('대시보드 RPC를 찾을 수 없습니다. SQL 마이그레이션이 실행되었는지 확인해주세요.');
          }
          throw error;
        }
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Set up interval for real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground font-bold">대시보드 데이터를 불러오지 못했습니다.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const getRevenueValue = () => {
    if (!stats) return '$0';
    const value = revenueType === 'total' 
      ? stats.total_revenue 
      : revenueType === 'subscription' 
        ? stats.subscription_revenue 
        : stats.shop_revenue;
    return `$${value.toLocaleString()}`;
  };

  const getRevenueTitle = () => {
    if (revenueType === 'total') return '전체 수익';
    if (revenueType === 'subscription') return '구독 수익';
    return '쇼핑몰 수익';
  };

  const summaryStats = [
    { 
      title: '총 사용자', 
      value: stats?.total_users.toLocaleString() || '0', 
      icon: Users, 
      color: 'text-primary-500 dark:text-primary-400', 
      bg: 'bg-primary-50 dark:bg-primary-900/30' 
    },
    { 
      title: '활성 세션', 
      value: stats?.online_users.toLocaleString() || '0', 
      icon: Activity, 
      color: 'text-primary dark:text-primary', 
      bg: 'bg-primary/10 dark:bg-primary-900/30' 
    },
    { 
      title: '신규 가입(7일)', 
      value: stats?.new_users_7d.toLocaleString() || '0', 
      change: stats?.user_growth_pct || 0,
      icon: TrendingUp, 
      color: 'text-violet-500 dark:text-violet-400', 
      bg: 'bg-violet-50 dark:bg-violet-900/30' 
    },
    { 
      title: getRevenueTitle(), 
      value: getRevenueValue(), 
      icon: revenueType === 'subscription' ? CreditCard : revenueType === 'shop' ? ShoppingBag : DollarSign, 
      color: 'text-amber-500 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      isRevenue: true
    },
  ];

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">대시보드 개요</h1>
          <p className="text-sm sm:text-base text-muted-foreground break-words">안녕하세요, 실시간 운영 지표입니다 (7일 대비 성장률 포함).</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 min-[350px]:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {summaryStats.map((stat, i) => (
          <motion.div 
            key={i} 
            layout
            className="bg-secondary p-3 sm:p-4 md:p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between min-h-[110px] sm:min-h-[140px]"
          >
            <div className="flex items-start justify-between mb-2 sm:mb-4 relative">
              <div className={`p-2 sm:p-3 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
                <stat.icon size={16} className="sm:w-5 sm:h-5" />
              </div>
              
              {stat.change !== undefined && (
                <span className={`text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  stat.change >= 0 
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-600' 
                  : 'bg-red-100 dark:bg-red-900/40 text-red-600'
                }`}>
                  {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                </span>
              )}

              {stat.isRevenue && (
                <div className="absolute right-0 top-0 flex flex-col items-end gap-1">
                  <div className="flex bg-muted p-0.5 rounded-lg border border-gray-300 dark:border-gray-600 scale-90 origin-top-right transition-all flex-wrap justify-end gap-0.5 max-w-[120px] sm:max-w-none">
                    {(['total', 'subscription', 'shop'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRevenueType(type);
                        }}
                        className={`px-2 py-1 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded-md transition-all ${
                          revenueType === type 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
                        }`}
                      >
                        {type === 'total' ? '전체' : type === 'subscription' ? '구독' : '쇼핑'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <AnimatePresence mode="wait">
                <motion.h3 
                  key={stat.value}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 truncate leading-tight"
                >
                  {stat.value}
                </motion.h3>
              </AnimatePresence>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart & Activity Section (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 min-w-0">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-secondary rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm p-3 sm:p-4 md:p-6 lg:h-[380px] flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4 sm:mb-8 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground truncate">사용자 가입 추이 (최근 7일)</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">막대 그래프 및 트렌드 라인 분석</p>
            </div>
            <button 
              className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-all group"
              title="데이터 내보내기 (준비 중)"
            >
              <MoreVertical size={20} className="transition-transform" />
            </button>
          </div>
          
          <div className="flex-1 relative min-h-[250px] mt-4">
            {/* SVG Trend Line Overlay - Points centered over bars */}
            {/* SVG Trend Line Overlay - Path only */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={stats?.daily_trends.map((trend, i) => {
                  const maxCount = Math.max(...stats!.daily_trends.map(t => t.count), 1);
                  const x = ((i + 0.5) / stats!.daily_trends.length) * 100;
                  const y = 100 - (trend.count / maxCount) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                className="text-primary/30"
              />
              <path
                d={stats?.daily_trends.map((trend, i) => {
                  const maxCount = Math.max(...stats!.daily_trends.map(t => t.count), 1);
                  const x = ((i + 0.5) / stats!.daily_trends.length) * 100;
                  const y = 100 - (trend.count / maxCount) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') + ` L ${((stats!.daily_trends.length - 1 + 0.5) / stats!.daily_trends.length) * 100} 100 L ${(0.5 / stats!.daily_trends.length) * 100} 100 Z`}
                fill="url(#lineGradient)"
              />
            </svg>

            <div className="h-full flex items-end relative z-0">
                {stats?.daily_trends.map((trend, idx) => {
                  const maxCount = Math.max(...stats.daily_trends.map(t => t.count), 1);
                  const heightPercent = trend.count === 0 ? 3 : (trend.count / maxCount) * 100;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      {/* CSS Circular Point - Guaranteed to be a circle */}
                      <div 
                        className="absolute z-20 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-sm transition-transform group-hover:scale-125"
                        style={{ 
                          bottom: `${heightPercent}%`, 
                          transform: 'translateY(50%)' 
                        }}
                      />

                      <div className="w-1/2 sm:w-2/5 max-w-[40px] bg-muted/20 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-t-xl relative transition-all cursor-pointer overflow-hidden" style={{ height: '100%' }}>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 1.2, ease: 'backOut' }}
                          className="absolute bottom-0 left-0 right-0 mx-auto w-full bg-gradient-to-t from-primary/30 to-primary/60 dark:from-primary/20 dark:to-primary/40 rounded-t-lg transition-all group-hover:from-primary/50 group-hover:to-primary/80"
                        />
                      </div>
                      {/* Tooltip at the Bottom - Closer to the graph */}
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-30 shadow-xl border border-background/10 scale-90 group-hover:scale-100 origin-top">
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
                        {trend.count}명 가입
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex justify-between mt-8 text-[10px] sm:text-xs text-muted-foreground px-1 border-t border-gray-100 dark:border-gray-800 pt-3 shrink-0">
            {stats?.daily_trends.map((trend, idx) => (
              <span key={idx} className="flex-1 text-center font-bold flex flex-col gap-0.5">
                <span>{new Date(trend.date).toLocaleDateString('ko-KR', { weekday: 'short' })}</span>
                <span className="text-[9px] opacity-60 font-medium">
                  {new Date(trend.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Recent Users List */}
        <div className="bg-secondary rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm p-3 sm:p-4 md:p-6 flex flex-col lg:h-[380px] min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 sm:mb-6 shrink-0 truncate">최근 접속 사용자</h2>
          <div className="space-y-3 sm:space-y-5 flex-1 overflow-hidden">
            {stats?.recent_users.map((user, i) => {
              const isOnline = isUserOnline(user);
              return (
              <div 
                key={i} 
                className="flex items-center gap-2 sm:gap-3 group cursor-pointer hover:bg-muted/30 p-2 sm:p-2.5 rounded-2xl transition-all" 
                onClick={() => {
                  setSelectedUser(user);
                  setShowProfileModal(true);
                }}
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary transition-all overflow-hidden shrink-0 shadow-sm">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-xs sm:text-sm">{user.nickname.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {user.nickname}
                    </p>
                    {isOnline && (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg whitespace-nowrap ${
                  isOnline 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'bg-muted/50 text-muted-foreground'
                }`}>
                  {isOnline 
                    ? '접속 중' 
                    : (user.last_active_at 
                        ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true, locale: ko })
                            .replace('1분 미만', '1분')
                        : '기록 없음')}
                </span>
              </div>
            );
            })}
          </div>
          <button 
            onClick={() => navigate('/admin/users')}
            className="w-full mt-4 sm:mt-6 py-2 sm:py-3 text-xs sm:text-sm text-center text-primary-600 dark:text-primary-400 hover:bg-primary/10 font-bold border-2 border-primary/10 hover:border-primary/30 rounded-xl sm:rounded-2xl transition-all shrink-0"
          >
            전체 사용자 목록 보기
          </button>
        </div>
      </div>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminHome;
