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
  AlertCircle,
  Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UserProfileModal from './components/UserProfileModal';
import { usePresence } from '@/contexts/PresenceContext';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';

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
  const [hybridData, setHybridData] = useState({ totalLogs: 0, distinctUsers: 0 });
  const { onlineCount, sessionCount, isUserOnline, stats: globalStats } = usePresence();

  useEffect(() => {
     const fetchHybridLogs = async () => {
        const { count: total } = await supabase.from('traffic_logs').select('*', { count: 'exact', head: true });
        const { data: users } = await supabase.from('traffic_logs').select('user_id').not('user_id', 'is', null);
        const distinct = new Set(users?.map(u => u.user_id)).size;
        setHybridData({ totalLogs: total || 0, distinctUsers: distinct || 0 });
     };
     fetchHybridLogs();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        if (error) throw error;
        setStats(data);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        if (err.status === 400 || err.code === 'PGRST202') {
           toast.error('대시보드 데이터 수신 오류 (400). 최신 SQL 마이그레이션을 적용했는지 확인해주세요.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); 
    return () => clearInterval(interval);
  }, []);

  const displayStats = {
    total_users: globalStats.totalUsers || stats?.total_users || 0,
    online_users: onlineCount,
    session_count: sessionCount,
    new_users_7d: globalStats.newUsers7d || stats?.new_users_7d || 0,
    pending_reports: stats?.pending_reports || 0,
    total_revenue: stats?.total_revenue || 0,
    user_growth_pct: stats?.user_growth_pct || 0
  };

  const getRevenueValue = () => {
    if (!stats) return '$0';
    const value = revenueType === 'total' ? stats.total_revenue : revenueType === 'subscription' ? stats.subscription_revenue : stats.shop_revenue;
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const summaryStats = [
    { title: '전체 사용자', value: displayStats.total_users.toLocaleString(), change: displayStats.user_growth_pct, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
    { title: '실시간 접속 유저', value: displayStats.online_users.toLocaleString(), subtitle: `${displayStats.session_count}개 세션(탭) 활성`, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', isLive: true },
    { title: '신규 가입 (7일)', value: displayStats.new_users_7d.toLocaleString(), icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50' },
    { title: '신고 대기', value: displayStats.pending_reports.toLocaleString(), icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="w-full space-y-6 lg:space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">대시보드 개요</h1>
          <p className="text-muted-foreground text-sm mt-1">실시간 운영 지표 및 사용자 트렌드 (통합 버전)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, i) => (
          <motion.div 
            key={i} layout
            className="bg-secondary p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-sm`}>
                <stat.icon size={20} />
              </div>
              {stat.change !== undefined && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                </span>
              )}
              {stat.isLive && (
                <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  LIVE
                </span>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground leading-tight mb-1">{stat.value}</h3>
              <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
              {stat.subtitle && <p className="text-[10px] text-emerald-500 font-bold mt-1">{stat.subtitle}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hybrid Tracking Coverage Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group">
         <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <Activity size={150} className="text-emerald-500" />
         </div>
         <div className="flex items-start gap-4 z-10">
            <div className="p-3 bg-white dark:bg-emerald-900/50 rounded-xl shadow-sm text-emerald-600 dark:text-emerald-400">
               <Shield size={24} />
            </div>
            <div>
               <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm md:text-base flex items-center gap-2">
                  자체 DB 하이브리드 트래킹 가동 중
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full scale-animation">ACTIVE</span>
               </h3>
               <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 max-w-xl">
                  프론트엔드 레벨에서 Ad-block 등 광고 차단기를 우회하여 유입 데이터를 자체 데이터베이스(`traffic_logs`)에 안전하게 백업하고 있습니다. 구글 애널리틱스의 데이터 누락을 100% 상호 보완합니다.
               </p>
            </div>
         </div>
         <div className="flex gap-4 z-10 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-emerald-200/50 dark:border-emerald-800/50 md:pl-6 md:border-l">
            <div>
               <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">방어/수집된 트래픽</p>
               <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{hybridData.totalLogs.toLocaleString()}<span className="text-sm font-medium opacity-70 ml-1">건</span></p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">식별 유저</p>
               <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{hybridData.distinctUsers.toLocaleString()}<span className="text-sm font-medium opacity-70 ml-1">명</span></p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-secondary rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-6">사용자 가입 추이 (최근 7일)</h2>
          <div className="h-[250px] w-full flex items-end gap-2 px-2">
            {stats?.daily_trends.map((trend, idx) => {
              const max = Math.max(...stats.daily_trends.map(t => t.count), 1);
              const h = (trend.count / max) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                   <div className="absolute -top-6 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{trend.count}명</div>
                   <div className="w-full bg-primary/10 hover:bg-primary/20 rounded-t-lg transition-all" style={{ height: `${Math.max(h, 5)}%` }} />
                   <div className="mt-2 text-[10px] text-muted-foreground font-bold">{new Date(trend.date).toLocaleDateString('ko-KR', { weekday: 'short' })}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-secondary rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold mb-4">최근 접속 사용자</h2>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {stats?.recent_users.map((user) => {
              const online = isUserOnline(user.profile_id || user.id);
              return (
                <div key={user.id} onClick={() => { setSelectedUser(user); setShowProfileModal(true); }} className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer border border-transparent hover:border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatar_url ? <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Users size={18} /></div>}
                      <div className="absolute -bottom-0.5 -right-0.5"><OnlineIndicator userId={user.profile_id || user.id} size="sm" className="ring-2 ring-secondary" /></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[100px]">{user.nickname}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Activity size={10} /> {online ? '온라인' : (user.last_active_at ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true, locale: ko }) : '정보 없음')}</p>
                    </div>
                  </div>
                  <MoreVertical size={16} className="text-muted-foreground opacity-50" />
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate('/admin/users')} className="w-full mt-6 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 border-2 border-primary/10 rounded-xl transition-all">전체 사용자 목록</button>
        </div>
      </div>

      <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} user={selectedUser} />
    </div>
  );
};

export default AdminHome;
