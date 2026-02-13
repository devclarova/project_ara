
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Users, Database, DollarSign, TrendingUp, Zap, Filter, Download, PieChart, BarChart2, AlertTriangle, CheckCircle2, AlertOctagon, XCircle, Search, Layers, Globe } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactGA from "react-ga4";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { usePresence } from '../../contexts/PresenceContext';

// Types
interface StatsData {
  totalUsers: number;
  cumulativeUsers: number;
  newUsersRecent: number;
  newUserGrowth: number;
  activeUsers: number;
  postCount: number;
  commentCount: number;
  totalRevenue: number;
  conversionRate: number;
  anomalies: any[];
  chartData: Array<{ name: string; activity: number; signups: number }>;
  geoData: Array<{ country: string; count: number }>;
}

type Tab = 'overview' | 'acquisition' | 'retention' | 'dataops';

// Constants
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState('7일');
  const [selectedSegment, setSelectedSegment] = useState('전체 사용자');
  const [showCumulative, setShowCumulative] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { onlineUsers, dbOnlineUsers, onlineCount, sessionCount, isUserOnline, stats: globalStats } = usePresence();
  const [activeUsersSet, setActiveUsersSet] = useState<Set<string>>(new Set());

  // Tab Scroll Logic
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const onMouseLeave = () => { setIsDragging(false); };
  const onMouseUp = () => { setIsDragging(false); };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
     handleScroll();
     window.addEventListener('resize', handleScroll);
     return () => window.removeEventListener('resize', handleScroll);
  }, []);

  // Map Color Scale
  const colorScale = useMemo(() => {
     const maxCount = stats?.geoData.length ? Math.max(...stats.geoData.map(d => d.count)) : 10;
     return scaleLinear().domain([0, maxCount]).range(["#D1FAE5", "#059669"]);
  }, [stats]);


  // Initialize & Fetch
  useEffect(() => {
    setTimeout(() => setIsMounted(true), 200);
    
    // GA4 Init
    const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (GA_ID) {
        ReactGA.initialize(GA_ID);
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysIso = sevenDaysAgo.toISOString();

        // Active Criteria: Last active within 5 minutes (Legacy reliable check + heartbeat)
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const [
            { count: totalUsers },
            { count: activeUsers },
            { count: postCount },
            { count: commentCount },
            { count: newUsersRecent },
            { data: geoData },
            { data: recentTweets },
            { data: recentComments },
            { data: recentSignups }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            // Query by time instead of just 'is_online' for better accuracy if cleanup failed
            supabase.from('profiles').select('*', { count: 'exact', head: true }).or(`is_online.eq.true,last_active_at.gt.${fiveMinsAgo}`),
            supabase.from('tweets').select('*', { count: 'exact', head: true }),
            supabase.from('tweet_replies').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysIso),
            supabase.from('profiles').select('country').not('country', 'is', null).eq('is_online', true).limit(1000), // 실시간 접속자만 필터링
            supabase.from('tweets').select('created_at').gte('created_at', sevenDaysIso),
            supabase.from('tweet_replies').select('created_at').gte('created_at', sevenDaysIso),
            supabase.from('profiles').select('created_at').gte('created_at', sevenDaysIso)
        ]);

        // Aggregate Daily Activity for Chart
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })); 
        }
        
        const chartMap = days.map(label => ({ name: label, activity: 0, signups: 0 }));
        
        const addToMap = (dateStr: string, type: 'activity' | 'signups') => {
            if (!dateStr) return;
            const d = new Date(dateStr);
            const label = d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
            const item = chartMap.find(c => c.name === label);
            if (item) {
                if (type === 'activity') item.activity += 1;
                else item.signups += 1;
            }
        };

        recentTweets?.forEach(t => addToMap(t.created_at, 'activity'));
        recentComments?.forEach(c => addToMap(c.created_at, 'activity'));
        recentSignups?.forEach(u => addToMap(u.created_at, 'signups'));

        // Aggregate Geo Data (실시간 온라인 유저 기준 필터링)
        const countryStats: Record<string, number> = {};
        
        // stats.activeUsers 대신 현재 Presence에 있는 유저들의 국가 정보를 기반으로 집계하는 것이 더 정확함
        // 하지만 profiles 테이블에서 모든 국가 정보를 가져오는 geoData는 전체 사용자 기준임.
        // 이를 실시간 위주로 보여주기 위해, profiles에서 fetch할 때 online 유저만 필터링하거나 
        // 전체를 보여주되 레이블을 명확히 함. 
        // 여기서는 '실시간 접속 지역'이라는 컨셉에 맞춰 online 인원 위주로 필터링하도록profiles 쿼리 수정 제안 (또는 클라이언트 필터링)
        
        geoData?.forEach((p: any) => {
            const c = p.country; 
            if (c) countryStats[c] = (countryStats[c] || 0) + 1;
        });
        const geoArray = Object.entries(countryStats).map(([country, count]) => ({ country, count }));
 
        // setRealtimeUsers(activeUsers || 0); // PresenceContext handles this

        setStats({
            totalUsers: totalUsers || 0,
            cumulativeUsers: (totalUsers || 0) + 24, // Mock added history
            newUsersRecent: newUsersRecent || 0,
            newUserGrowth: 0, 
            activeUsers: activeUsers || 0,
            postCount: postCount || 0,
            commentCount: commentCount || 0,
            totalRevenue: 0,
            conversionRate: 0,
            chartData: chartMap,
            geoData: geoArray,
            anomalies: []
        });

      } catch (e) {
        console.error("Failed to load stats", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();

    // --- Realtime Subscriptions ---
    
    // Presence Context in App.tsx handles global online tracking.
    // Logic for Admin perspective: we just consume the shared presence state.

    // 2. Activity Monitor (Tweets/Comments) - Updates Chart & Counters
    const activityChannel = supabase
        .channel('admin-stats-activity')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tweets' }, () => {
            setStats(prev => {
                if (!prev) return null;
                const newChart = [...prev.chartData];
                const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
                const todayItem = newChart.find(c => c.name === todayLabel);
                if (todayItem) todayItem.activity += 1;
                return { ...prev, postCount: prev.postCount + 1, chartData: newChart };
            });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tweet_replies' }, () => {
             setStats(prev => {
                if (!prev) return null;
                const newChart = [...prev.chartData];
                const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
                const todayItem = newChart.find(c => c.name === todayLabel);
                if (todayItem) todayItem.activity += 1;
                return { ...prev, commentCount: prev.commentCount + 1, chartData: newChart };
            });
        })
        .subscribe();

    return () => { 
        supabase.removeChannel(activityChannel);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-secondary p-5 rounded-2xl border border-border/60 shadow-sm">
         <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
               <Activity className="text-primary" />
               데이터 분석실
            </h1>
            <p className="text-sm text-muted-foreground">GA4 및 데이터세트 통합 실시간 모니터링 대시보드</p>
         </div>

         <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border border-gray-300 dark:border-gray-500 rounded-lg text-sm">
               <Filter size={16} className="text-muted-foreground" />
               <select 
                  className="bg-transparent border-none outline-none text-foreground font-medium cursor-pointer"
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
               >
                  <option>전체 사용자</option>
                  <option>자연 유입 (Organic)</option>
                  <option>결제 사용자 (Paid)</option>
               </select>
            </div>

            <div className="flex items-center bg-muted border border-gray-300 dark:border-gray-500 rounded-lg p-1">
               {['24시간', '7일', '30일', '전체'].map((range) => (
                  <button
                     key={range}
                     onClick={() => setDateRange(range)}
                     className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        dateRange === range 
                           ? 'bg-secondary text-primary shadow-sm border border-border' 
                           : 'text-muted-foreground hover:text-foreground'
                     }`}
                  >
                     {range}
                  </button>
               ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-bold shadow-md">
               <Download size={16} />
               분석 리포트 다운로드
            </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="relative border-b border-gray-300 dark:border-gray-600/80 group">
          <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 transition-opacity pointer-events-none ${showLeftGradient ? 'opacity-100' : 'opacity-0'}`} />
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-4 md:gap-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onScroll={handleScroll}
          >
             <TabButton label="인사이트 오버뷰" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity} />
             <TabButton label="획득 및 참여" active={activeTab === 'acquisition'} onClick={() => setActiveTab('acquisition')} icon={Users} />
             <TabButton label="리텐션 및 퍼널" active={activeTab === 'retention'} onClick={() => setActiveTab('retention')} icon={Layers} />
             <TabButton label="데이터 운영 (Ops)" active={activeTab === 'dataops'} onClick={() => setActiveTab('dataops')} icon={Database} />
             <div className="w-4 shrink-0" />
          </div>
          <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 transition-opacity pointer-events-none ${showRightGradient ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Content Content - Overview */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
         {activeTab === 'overview' && (
            <div className="space-y-6">
               {loading ? (
                 <div className="flex h-64 items-center justify-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <span>실시간 데이터를 수집 중입니다...</span>
                    </div>
                 </div>
               ) : (
                <>
                   {/* Realtime Ticker */}
                   <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-primary/10 border border-emerald-100 rounded-xl text-sm text-emerald-800 dark:text-emerald-400 dark:border-emerald-900/50">
                      <div className="flex items-center gap-2 min-w-fit">
                        <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="font-semibold whitespace-nowrap">실시간 상태:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>현재 <strong>{onlineCount}명</strong>의 사용자가 활동 중입니다.</span>
                        <span className="hidden md:inline text-primary/30">|</span>
                        <span className="text-xs text-emerald-600/80 dark:text-emerald-500/80">
                           {new Date().toLocaleTimeString()} 기준 (5분 내 활동 감지)
                        </span>
                      </div>
                   </div>

                   {/* Cards Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                       {/* Metric Card 1: Users */}
                       <MetricCard 
                          title="사용자 수" 
                          value={showCumulative ? (globalStats.totalUsers?.toLocaleString() || "0") : (globalStats.totalUsers?.toLocaleString() || "0")} 
                          subtitle={showCumulative ? "전체 활성 계정" : "현재 활성 계정 기준"} 
                          icon={Users} 
                          badge={
                            <div className="flex p-0.5 bg-muted/30 rounded-full border border-border/40 shadow-sm backdrop-blur-sm">
                               <button onClick={(e) => { e.stopPropagation(); setShowCumulative(false); }} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${!showCumulative ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>현재</button>
                               <button onClick={(e) => { e.stopPropagation(); setShowCumulative(true); }} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showCumulative ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>누적</button>
                            </div>
                          }
                       />
                       
                       {/* Metric Card 2: New Users */}
                       <MetricCard title="신규 유입 (7일)" value={globalStats.newUsers7d?.toLocaleString() || "0"} trend="Recent" trendUp={true} subtitle="최근 일주일 신규 가입" icon={TrendingUp} />
 
                        {/* Metric Card 3: Active (Realtime) */}
                        <MetricCard 
                           title="실시간 활동 지수" 
                           value={onlineCount.toLocaleString()} 
                           subtitle={`${sessionCount}개의 세션(탭)이 활성 상태입니다.`} 
                          icon={Activity} 
                          badge={
                            <div className="min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                               <span className="relative flex h-2 w-2">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                               </span>
                               <span className="text-[10px] font-black uppercase tracking-wider">라이브</span>
                            </div>
                          }
                       />

                      {/* Metric Card 4: Content */}
                      <MetricCard 
                         title="콘텐츠 현황" 
                         value={showComments ? (stats?.commentCount?.toLocaleString() || "0") : (stats?.postCount?.toLocaleString() || "0")} 
                         subtitle={showComments ? "댓글 및 답글 수" : "게시글 및 트윗 수"} 
                         icon={Database} 
                         badge={
                           <div className="flex p-0.5 bg-muted/30 rounded-full border border-border/40 shadow-sm backdrop-blur-sm">
                              <button onClick={(e) => { e.stopPropagation(); setShowComments(false); }} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${!showComments ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>게시글</button>
                              <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showComments ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>댓글</button>
                           </div>
                         }
                      />

                      <MetricCard title="총 매출" value={`$${stats?.totalRevenue?.toLocaleString() || "0"}`} trend="-" subtitle="결제 시스템 연동 예정" icon={DollarSign} />
                      <MetricCard title="구매 전환률" value={`${stats?.conversionRate || 0}%`} trend="-" subtitle="활성 유저 대비" icon={Zap} />
                   </div>

                   {/* Anomaly / System Health */}
                   <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl flex-shrink-0"><CheckCircle2 size={24} /></div>
                        <div>
                           <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">시스템 정상 운영 중 (System Healthy)</h3>
                           <p className="text-sm text-emerald-600/80 dark:text-emerald-400/60 mt-1">
                              AI 보안 엔진이 24시간 실시간 감시 중입니다. 현재 특이사항 없습니다.
                           </p>
                        </div>
                   </div>

                   {/* Charts & MAP */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Chart */}
                      <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm lg:col-span-2 min-w-0">
                         <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <BarChart2 size={18} className="text-muted-foreground" />
                            주간 활동 추이 (Last 7 Days)
                         </h3>
                         <div className="h-[300px] w-full min-h-[300px] relative">
                           {isMounted && (
                             <ResponsiveContainer width="100%" height={300}>
                             <AreaChart data={stats?.chartData || []}>
                               <defs>
                                 <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                   <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                               <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                               <YAxis tick={{fontSize: 11}} axisLine={false} tickLine={false} allowDecimals={false} />
                               <Tooltip 
                                 content={({ active, payload, label }) => {
                                   if (active && payload && payload.length) {
                                     return (
                                       <div className="bg-background/95 backdrop-blur-sm p-3 rounded-xl border border-border shadow-xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                                         <div className="text-[11px] font-black text-muted-foreground mb-1.5 uppercase tracking-tighter">{label}</div>
                                         <div className="space-y-1">
                                           <div className="flex items-center gap-2 text-xs">
                                             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                             <b>활동: {payload[0].value}건</b>
                                           </div>
                                         </div>
                                       </div>
                                     );
                                   }
                                   return null;
                                 }}
                               />
                               <Area type="monotone" dataKey="activity" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                             </AreaChart>
                           </ResponsiveContainer>
                           )}
                         </div>
                      </div>

                      {/* Right: Geo Map */}
                      <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm flex flex-col">
                         <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                             <Globe size={18} className="text-muted-foreground" />
                             실시간 접속 지역 (World Map)
                         </h3>
                         <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] bg-muted/30 rounded-xl overflow-hidden relative">
                            {isMounted ? (
                                <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }}>
                                    <Geographies geography={GEO_URL}>
                                        {({ geographies }: { geographies: any[] }) =>
                                            geographies.map((geo: any) => {
                                                const countryData = stats?.geoData.find(d => d.country === geo.properties.ISO_A2 || d.country === geo.properties.NAME);
                                                return (
                                                    <Geography
                                                        key={geo.rsmKey}
                                                        geography={geo}
                                                        fill={countryData ? colorScale(countryData.count) : "#EAEAEC"}
                                                        stroke="#D6D6DA"
                                                        strokeWidth={0.5}
                                                        style={{
                                                            default: { outline: "none" },
                                                            hover: { fill: "#10B981", outline: "none" },
                                                            pressed: { outline: "none" },
                                                        }}
                                                    />
                                                );
                                            })
                                        }
                                    </Geographies>
                                </ComposableMap>
                            ) : (
                                <div className="text-xs text-muted-foreground">Loading Map...</div>
                            )}
                            
                            {/* Simple Legend Overlay */}
                            <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
                                <div className="flex flex-col gap-2">
                                     {(stats?.geoData || []).slice(0, 3).map((d, i) => (
                                         <div key={i} className="flex justify-between text-xs">
                                             <span className="font-semibold">{d.country}</span>
                                             <span className="font-bold text-emerald-600">{d.count} Users</span>
                                         </div>
                                     ))}
                                     {(stats?.geoData.length || 0) > 3 && (
                                         <div className="text-[10px] text-center text-muted-foreground pt-1 border-t">
                                             + {(stats?.geoData.length || 0) - 3} more regions
                                         </div>
                                     )}
                                     {(stats?.geoData.length === 0) && <div className="text-xs text-center text-muted-foreground">No location data yet</div>}
                                </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </>
               )}
            </div>
         )}

         {activeTab === 'acquisition' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                     <h3 className="font-bold text-foreground mb-4">채널별 유입 경로</h3>
                     <div className="space-y-4">
                        {[
                           { label: '검색 (Organic)', value: 45, color: 'bg-emerald-500' },
                           { label: '소셜 (Social)', value: 28, color: 'bg-blue-500' },
                           { label: '직접 접속 (Direct)', value: 15, color: 'bg-purple-500' },
                           { label: '추천 (Referral)', value: 12, color: 'bg-amber-500' }
                        ].map((item, i) => (
                           <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                 <span>{item.label}</span>
                                 <span className="font-bold text-foreground">{item.value}%</span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                 <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm md:col-span-2">
                     <h3 className="font-bold text-foreground mb-4">가입 전환 퍼널</h3>
                     <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
                        {[
                           { step: '방문', count: '1,240', drop: '100%', icon: Globe },
                           { step: '회원가입/로그인 페이지', count: '850', drop: '68%', icon: Search },
                           { step: '가입 완료', count: '312', drop: '25%', icon: CheckCircle2 }
                        ].map((item, i, arr) => (
                           <React.Fragment key={i}>
                              <div className="flex-1 flex flex-col items-center p-4 bg-muted/30 rounded-xl border border-border/40 w-full">
                                 <div className="p-3 bg-primary/10 text-primary rounded-full mb-3">
                                    <item.icon size={24} />
                                 </div>
                                 <span className="text-sm font-medium text-muted-foreground">{item.step}</span>
                                 <span className="text-xl font-bold mt-1">{item.count}</span>
                                 <span className="text-xs text-primary font-bold mt-1">{item.drop}</span>
                              </div>
                              {i < arr.length - 1 && (
                                 <div className="hidden md:block text-muted-foreground">
                                    <TrendingUp className="rotate-90" size={24} />
                                 </div>
                              )}
                           </React.Fragment>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'retention' && (
            <div className="space-y-6">
               <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                  <h3 className="font-bold text-foreground mb-4">사용자 유지율 (Retention Rate)</h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                        <thead>
                           <tr className="border-b">
                              <th className="text-left py-3 px-4 font-black">Cohort</th>
                              <th className="py-3 px-4">Size</th>
                              {['D+1', 'D+3', 'D+7', 'D+14', 'D+30'].map(d => (
                                 <th key={d} className="py-3 px-4 font-black">{d}</th>
                              ))}
                           </tr>
                        </thead>
                        <tbody>
                           {[
                              { date: '2024-02-01', size: 120, rates: [45, 32, 28, 22, 18] },
                              { date: '2024-02-02', size: 145, rates: [48, 35, 29, 24, 19] },
                              { date: '2024-02-03', size: 110, rates: [42, 30, 25, 21, 15] },
                              { date: '2024-02-04', size: 130, rates: [51, 38, 31, 26, 20] }
                           ].map((row, i) => (
                              <tr key={i} className="border-b hover:bg-muted/20">
                                 <td className="py-3 px-4 font-medium">{row.date}</td>
                                 <td className="py-3 px-4 text-center text-muted-foreground">{row.size}</td>
                                 {row.rates.map((rate, j) => (
                                    <td key={j} className="py-3 px-4 text-center">
                                       <div 
                                          className="py-2 rounded-md font-bold" 
                                          style={{ 
                                             backgroundColor: `rgba(16, 185, 129, ${rate / 100})`,
                                             color: rate > 50 ? 'white' : 'inherit'
                                          }}
                                       >
                                          {rate}%
                                       </div>
                                    </td>
                                 ))}
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'dataops' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                     <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" />
                        시스템 성능 리포트
                     </h3>
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                           <span className="text-sm font-medium">평균 API 응답 속도</span>
                           <span className="text-xl font-bold text-emerald-600">142ms</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: '92%' }} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                              <div className="text-xs text-muted-foreground mb-1">DB Connection</div>
                              <div className="text-lg font-bold text-emerald-600">Stable</div>
                           </div>
                           <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                              <div className="text-xs text-muted-foreground mb-1">Cache Hit Rate</div>
                              <div className="text-lg font-bold text-emerald-600">88.4%</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                     <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        보안 및 이상 징후 감지
                     </h3>
                     <div className="space-y-3">
                        {[
                           { type: 'Info', msg: '비정상적 로그인 시도 차단 (IP: 192.x.x.x)', time: '2시간 전', status: 'Blocked' },
                           { type: 'Warning', msg: '특정 사용자 게시글 도배 감지', time: '5시간 전', status: 'Reviewing' },
                           { type: 'Success', msg: '정기 보안 취약점 점검 완료', time: '1일 전', status: 'Resolved' }
                        ].map((log, i) => (
                           <div key={i} className="flex justify-between items-center p-3 hover:bg-muted/30 rounded-lg border border-transparent hover:border-border/40 transition-all">
                              <div className="flex items-center gap-3">
                                 <div className={`w-2 h-2 rounded-full ${log.type === 'Warning' ? 'bg-amber-500' : log.type === 'Info' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                 <div>
                                    <div className="text-sm font-medium">{log.msg}</div>
                                    <div className="text-[10px] text-muted-foreground">{log.time}</div>
                                 </div>
                              </div>
                              <span className="text-xs font-bold text-muted-foreground">{log.status}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

const TabButton = ({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: any }) => (
  <button onClick={onClick} className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors whitespace-nowrap select-none ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
    <Icon size={18} /> {label}
    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
  </button>
);

const MetricCard = ({ title, value, subtitle, trend, trendUp, icon: Icon, badge, color = "primary" }: any) => (
  <div className="p-5 bg-secondary rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      {badge ? badge : trend && (
         <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
            {trend}
         </div>
      )}
    </div>
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{subtitle}</p>}
    </div>
  </div>
);

export default AdminAnalytics;


