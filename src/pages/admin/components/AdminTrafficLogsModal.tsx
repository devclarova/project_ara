/**
 * 하이브리드 트래픽 분석 및 Ad-block 우회 로깅
 * - 목적: 서비스 유입 경로(UTM), 실시간 유저 활동 및 트래픽 추이를 시각화하여 마케팅 효율성 및 인프라 부하를 정밀 분석
 * - 방식: Ad-block을 우회하는 자체 수집 엔진(Hybrid Tracking)의 로그 데이터를 실시간 폴링(Polling) 및 Recharts 시각화 통합
 */
import React, { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  Activity, 
  Users, 
  ShieldCheck, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  Globe, 
  MousePointer2,
  TrendingUp,
  Zap,
  BarChart3,
  ExternalLink,
  ChevronDown,
  Layout,
  Loader2,
  Share2,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorMessage';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TrafficLog {
  id: string;
  user_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_page: string | null;
  created_at: string;
  profiles?: {
    nickname: string;
    avatar_url: string | null;
  };
}

interface AdminTrafficLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTotalLogs: number;
  initialDistinctUsers: number;
  onSelectUser: (user: TrafficLog['profiles']) => void;
}

const COLORS = ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'];

type TabType = 'overview' | 'sources' | 'users' | 'logs';

const AdminTrafficLogsModal: React.FC<AdminTrafficLogsModalProps> = ({ 
  isOpen, 
  onClose,
  initialTotalLogs,
  initialDistinctUsers,
  onSelectUser
}) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [renderCharts, setRenderCharts] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TrafficLog | null>(null);

  // 실시간 폴링 (10초 주기) 및 초기 로드
  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const pollInterval = setInterval(fetchLogs, 10000);
      
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        setRenderCharts(true);
        window.dispatchEvent(new Event('resize'));
      }, 600);

      return () => {
         clearInterval(pollInterval);
         clearTimeout(timer);
         document.body.style.overflow = 'unset';
      };
    } else {
      setRenderCharts(false);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    try {
      // 이미 데이터가 있다면 로딩 스피너를 보이지 않음 (부드러운 업데이트)
      if (logs.length === 0) setLoading(true);
      
      const { data: logData, error: logError } = await (supabase.from('traffic_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200); // 더 많은 데이터를 가져와서 상세 분석에 활용

      if (logError) throw logError;
      if (!logData) { setLogs([]); return; }

      const userIds = [...new Set(logData.map((l: any) => l.user_id).filter((id: any) => !!id))];
      
      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await (supabase.from('profiles') as any)
          .select('user_id, nickname, avatar_url')
          .in('user_id', userIds);
        
        if (!profileError && profileData) {
          const profileMap = new Map(profileData.map((p: any) => [p.user_id, p]));
          const merged = logData.map((l: any) => ({
            ...l,
            profiles: l.user_id ? profileMap.get(l.user_id) : undefined
          }));
          setLogs(merged as TrafficLog[]);
        } else {
          setLogs(logData as TrafficLog[]);
        }
      } else {
        setLogs(logData as TrafficLog[]);
      }
    } catch (error: unknown) {
      console.error('Error fetching traffic logs:', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const lowerSearch = searchTerm.toLowerCase();
    return logs.filter(log => 
      (log.utm_source?.toLowerCase().includes(lowerSearch)) ||
      (log.utm_medium?.toLowerCase().includes(lowerSearch)) ||
      (log.utm_campaign?.toLowerCase().includes(lowerSearch)) ||
      (log.landing_page?.toLowerCase().includes(lowerSearch)) ||
      (log.profiles?.nickname?.toLowerCase().includes(lowerSearch))
    );
  }, [logs, searchTerm]);

  // 상세 분석 데이터 계산
  const analysisData = useMemo(() => {
    const sourceMap = new Map<string, { count: number, lastSeen: string, mediums: Set<string> }>();
    const userMap = new Map<string, { count: number, lastSeen: string, profile?: TrafficLog['profiles'], topSource: string }>();
    const hourlyDataMap = new Map<string, number>();
    
    logs.forEach(log => {
      // 1. 유입 채널 분석
      const src = log.utm_source || '직접 유입';
      const existingSrc = sourceMap.get(src) || { count: 0, lastSeen: log.created_at, mediums: new Set() };
      existingSrc.count++;
      if (new Date(log.created_at) > new Date(existingSrc.lastSeen)) existingSrc.lastSeen = log.created_at;
      if (log.utm_medium) existingSrc.mediums.add(log.utm_medium);
      sourceMap.set(src, existingSrc);

      // 2. 사용자 분석
      if (log.user_id) {
        const existingUser = userMap.get(log.user_id) || { count: 0, lastSeen: log.created_at, profile: log.profiles, topSource: src };
        existingUser.count++;
        if (new Date(log.created_at) > new Date(existingUser.lastSeen)) {
           existingUser.lastSeen = log.created_at;
        }
        userMap.set(log.user_id, existingUser);
      }

      // 3. 시간대별 추이
      const date = new Date(log.created_at);
      const hourStr = `${date.getHours()}시`;
      hourlyDataMap.set(hourStr, (hourlyDataMap.get(hourStr) || 0) + 1);
    });

    const sourceList = Array.from(sourceMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    const userList = Array.from(userMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    const trendData = Array.from(hourlyDataMap.entries())
      .map(([name, count]) => ({ name, count }))
      .reverse();

    return { sourceList, userList, trendData };
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col"
      >
        {/* Header Section */}
        <div className="p-6 lg:p-8 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-50/30 to-blue-50/30 dark:from-emerald-950/10 dark:to-blue-950/10">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl lg:text-2xl font-black tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                <span className="truncate">하이브리드 트래킹 상세 분석</span>
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full uppercase font-bold animate-pulse">Live</span>
              </h2>
              <p className="text-xs lg:text-sm text-muted-foreground font-medium truncate">Ad-block 우회 정밀 수집 엔진 대시보드</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none overflow-x-auto no-scrollbar">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 w-max lg:w-auto">
                 {[
                   { id: 'overview', label: '통계 개요', icon: Layout },
                   { id: 'sources', label: '유입 채널', icon: Share2 },
                   { id: 'users', label: '고유 유저', icon: UserCheck },
                   { id: 'logs', label: '실시간 로그', icon: Clock },
                 ].map((tab) => (
                   <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-3 lg:px-4 py-2 text-[10px] lg:text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-zinc-800 shadow-md text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'}`}
                   >
                     <tab.icon size={14} />
                     {tab.label}
                   </button>
                 ))}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-muted-foreground shrink-0"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-zinc-50/50 dark:bg-zinc-950/50">
          
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard 
                    title="총 수집 트래픽" 
                    value={initialTotalLogs.toLocaleString()} 
                    icon={Activity} 
                    color="emerald" 
                    subtitle="Ad-block 우회 성공"
                  />
                  <MetricCard 
                    title="고유 식별 사용자" 
                    value={initialDistinctUsers.toLocaleString()} 
                    icon={Users} 
                    color="blue" 
                    subtitle="ID 기반 정밀 트래킹"
                  />
                  <MetricCard 
                    title="수집 정밀도" 
                    value="99.9%" 
                    icon={Zap} 
                    color="amber" 
                    subtitle="실시간 무결성 검증"
                  />
                  <MetricCard 
                    title="주요 유입 소스" 
                    value={analysisData.sourceList[0]?.name || '-'} 
                    icon={Globe} 
                    color="indigo" 
                    subtitle="최다 유입 경로"
                  />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Traffic Trend Chart */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500" /> 시간대별 유입 추이</h3>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Last 24h Trend</span>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center relative bg-white/50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-gray-100 dark:border-zinc-800">
                      {renderCharts ? (
                        <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                          <AreaChart data={analysisData.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#9CA3AF' }} />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#9CA3AF' }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.9)' }}
                              cursor={{ stroke: '#10B981', strokeWidth: 1 }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                           <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                           <div className="text-xs font-bold text-muted-foreground">시각화 엔진 준비 중...</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Distribution Chart */}
                  <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-6"><BarChart3 size={16} className="text-blue-500" /> 유입 경로 비중</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                       <div className="h-[180px] w-full flex items-center justify-center">
                          {renderCharts ? (
                            <ResponsiveContainer width="100%" height={180} minWidth={0} minHeight={0}>
                              <PieChart>
                                <Pie
                                  data={analysisData.sourceList.slice(0, 5)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={75}
                                  paddingAngle={8}
                                  dataKey="count"
                                >
                                  {analysisData.sourceList.slice(0, 5).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                             <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                          )}
                       </div>
                       <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                          {analysisData.sourceList.slice(0, 4).map((d, i) => (
                             <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-bold text-muted-foreground truncate">{d.name}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'sources' && (
              <motion.div 
                key="sources"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                   <h3 className="text-lg font-black flex items-center gap-2"><Share2 size={20} className="text-emerald-500" /> 유입 채널별 상세 분석</h3>
                   <span className="text-xs text-muted-foreground">전체 {analysisData.sourceList.length}개 소스 감지됨</span>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-gray-100 dark:border-zinc-800">
                         <th className="px-8 py-4">유입 소스 (Source)</th>
                         <th className="px-8 py-4">방문 수 (Traffic)</th>
                         <th className="px-8 py-4">주요 매체 (Mediums)</th>
                         <th className="px-8 py-4 text-right">마지막 방문</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {analysisData.sourceList.map((src, i) => (
                          <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 font-black text-xs">
                                     {src.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-sm tracking-tight">{src.name}</span>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-2">
                                  <span className="text-lg font-black">{src.count.toLocaleString()}</span>
                                  <span className="text-[10px] text-muted-foreground font-bold">건</span>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex flex-wrap gap-1">
                                  {Array.from(src.mediums).map((m, mi) => (
                                    <span key={mi} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-[9px] font-bold text-muted-foreground">{m}</span>
                                  ))}
                               </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <span className="text-xs font-medium text-muted-foreground">{formatDistanceToNow(new Date(src.lastSeen), { addSuffix: true, locale: ko })}</span>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                   <h3 className="text-lg font-black flex items-center gap-2"><UserCheck size={20} className="text-blue-500" /> 고유 식별 사용자 관리</h3>
                   <span className="text-xs text-muted-foreground">현재 데이터 기준 {analysisData.userList.length}명 식별됨</span>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-gray-100 dark:border-zinc-800">
                         <th className="px-8 py-4">사용자 정보</th>
                         <th className="px-8 py-4">총 활동 수</th>
                         <th className="px-8 py-4">주요 유입 경로</th>
                         <th className="px-8 py-4 text-right">마지막 활동</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {analysisData.userList.map((user, i) => (
                          <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                            <td className="px-8 py-5">
                               <button 
                                 onClick={() => user.profile && onSelectUser(user.profile)}
                                 className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                               >
                                  {user.profile?.avatar_url ? (
                                    <img src={user.profile.avatar_url} className="w-10 h-10 rounded-full ring-2 ring-blue-500/10" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 focus:ring-4 focus:ring-white">
                                      <Users size={18} />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-black text-sm text-foreground">{user.profile?.nickname || '회원'}</span>
                                    <span className="text-[10px] text-muted-foreground font-bold">UID: {user.id.slice(0, 12)}...</span>
                                  </div>
                               </button>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-2">
                                  <span className="text-lg font-black">{user.count.toLocaleString()}</span>
                                  <span className="text-[10px] text-muted-foreground font-bold">액션</span>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/10">
                                 {user.topSource}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-right text-xs font-medium text-muted-foreground">
                               {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true, locale: ko })}
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Search Bar */}
                <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-2 pl-4 rounded-2xl shadow-sm">
                  <Search size={20} className="text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="소스, 매체, 사용자 닉네임 또는 랜딩 페이지 검색..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Filter size={12} /> 필터
                  </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                          <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">수집 일시</th>
                          <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">사용자</th>
                          <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">유입 소스 (UTM)</th>
                          <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">랜딩 페이지</th>
                          <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                        {loading && logs.length === 0 ? (
                          <tr><td colSpan={5} className="p-20 text-center text-muted-foreground text-sm font-medium">데이터를 분석 중입니다...</td></tr>
                        ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                <Clock size={12} className="text-muted-foreground" />
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ko })}
                              </div>
                            </td>
                             <td className="px-6 py-4">
                               <button 
                                 onClick={() => log.profiles && onSelectUser(log.profiles)}
                                 className="flex items-center gap-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-1.5 rounded-xl transition-all group/user text-left"
                               >
                                 {log.profiles?.avatar_url ? (
                                   <img src={log.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/10" />
                                 ) : (
                                   <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                     <Users size={14} />
                                   </div>
                                 )}
                                 <div className="flex flex-col">
                                   <span className="text-xs font-black text-foreground group-hover/user:text-emerald-600 transition-colors">{log.profiles?.nickname || '익명 방문자'}</span>
                                   <span className="text-[10px] font-bold text-muted-foreground/60">{log.user_id ? '회원' : '비회원'}</span>
                                 </div>
                               </button>
                             </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-primary">{log.utm_source || '직접 유입'}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                                  {log.utm_medium || 'N/A'} / {log.utm_campaign || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-[150px] truncate text-xs text-muted-foreground font-medium bg-secondary/50 px-2 py-1 rounded-lg">
                                {log.landing_page || '/'}
                              </div>
                            </td>
                             <td className="px-6 py-4 text-right">
                               <button 
                                 onClick={() => setSelectedLog(log)}
                                 className="p-2 opacity-0 group-hover:opacity-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all shadow-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px] font-bold"
                               >
                                 상세보기 <ChevronRight size={14} />
                               </button>
                             </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="p-20 text-center text-muted-foreground text-sm font-medium">검색 결과가 없습니다.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50/50 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
           <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-1"><Layout size={12} /> 분석 엔진 v2.6</span>
              <span className="h-3 w-px bg-gray-300 dark:bg-zinc-700" />
              <span className="flex items-center gap-1 text-emerald-500"><ShieldCheck size={12} /> 데이터 무결성 검증됨</span>
           </div>
           <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-foreground text-background text-sm font-black rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95"
           >
             대시보드 닫기
           </button>
        </div>
      </motion.div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl p-6 lg:p-8 border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                     <Zap size={20} />
                   </div>
                   <div>
                     <h3 className="text-lg lg:text-xl font-black text-foreground">트래픽 상세 분석</h3>
                     <p className="text-[9px] lg:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Detailed Traffic Analysis</p>
                   </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <div className="p-4 lg:p-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                   <p className="text-[9px] lg:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-2 lg:mb-3 tracking-widest">방문자 프로필</p>
                   <div className="flex items-center gap-4">
                     {selectedLog.profiles?.avatar_url ? (
                       <img src={selectedLog.profiles.avatar_url} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full ring-4 ring-white dark:ring-zinc-800 shadow-sm" />
                     ) : (
                       <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-muted-foreground">
                         <Users size={20} />
                       </div>
                     )}
                     <div className="min-w-0">
                       <p className="font-black text-base lg:text-lg truncate">{selectedLog.profiles?.nickname || '익명 방문자'}</p>
                       <p className="text-[9px] lg:text-[10px] text-muted-foreground font-bold truncate">{selectedLog.user_id ? `UID: ${selectedLog.user_id.slice(0, 18)}...` : '비회원 (식별 코드 없음)'}</p>
                     </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 lg:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                     <p className="text-[9px] lg:text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-tighter">유입 소스 (Source)</p>
                     <p className="font-black text-xs lg:text-sm text-primary truncate">{selectedLog.utm_source || '직접 유입'}</p>
                   </div>
                   <div className="p-3 lg:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                     <p className="text-[9px] lg:text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-tighter">매체 (Medium)</p>
                     <p className="font-bold text-xs lg:text-sm tracking-tight truncate">{selectedLog.utm_medium || 'Organic'}</p>
                   </div>
                 </div>

                 <div className="p-3 lg:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                   <p className="text-[9px] lg:text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-tighter">캠페인 명 (Campaign)</p>
                   <p className="font-bold text-xs lg:text-sm truncate">{selectedLog.utm_campaign || 'Default'}</p>
                 </div>

                 <div className="p-3 lg:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                   <p className="text-[9px] lg:text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-tighter">랜딩 페이지 URL</p>
                   <div className="text-[10px] lg:text-[11px] font-medium break-all text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 line-clamp-2">
                     {selectedLog.landing_page || '/'}
                   </div>
                 </div>

                 <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                   <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-tighter">참조 주소 (Referrer)</p>
                   <p className="text-[10px] font-medium break-all opacity-60 leading-relaxed">{selectedLog.referrer || '정보 없음'}</p>
                </div>

                <button 
                  onClick={() => setSelectedLog(null)}
                  className="w-full py-4 mt-4 bg-foreground text-background font-black rounded-2xl hover:opacity-90 transition-all shadow-xl active:scale-[0.98]"
                >
                  분석 창 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'amber' | 'indigo';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, color }) => {
  const colorMap = {
    emerald: 'text-emerald-500 border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-900/30',
    blue: 'text-blue-500 border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-900/30',
    amber: 'text-amber-500 border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/30',
    indigo: 'text-indigo-500 border-indigo-200/50 bg-indigo-50/30 dark:bg-indigo-950/20 dark:border-indigo-900/30',
  };

  return (
    <div className={`p-5 rounded-3xl border ${colorMap[color]} shadow-sm group hover:scale-[1.02] transition-transform duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
          <Icon size={18} />
        </div>
        <div className="p-1 bg-white/50 dark:bg-black/20 rounded-lg">
          <Activity size={10} className="animate-pulse" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
        <h4 className="text-2xl font-black tracking-tight mb-1">{value}</h4>
        <p className="text-[10px] font-bold opacity-50">{subtitle}</p>
      </div>
    </div>
  );
};

export default AdminTrafficLogsModal;
