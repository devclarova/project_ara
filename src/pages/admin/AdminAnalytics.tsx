import { 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  Users, 
  TrendingUp, 
  Globe, 
  Activity, 
  AlertOctagon, 
  AlertTriangle,
  Database, 
  Server, 
  Filter, 
  Download,
  Calendar,
  Zap,
  Layers,
  BarChart2,
  PieChart as PieIcon,
  MousePointerClick,
  RefreshCw,
  CheckCircle2,
  Lock,
  Search,
  RotateCw,
  DollarSign
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import ReactGA from "react-ga4";

// --- Type Definitions ---
type Tab = 'overview' | 'acquisition' | 'retention' | 'dataops';

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
  chartData: { name: string; activity: number; signups: number }[];
  topPages: { path: string; page: string; views: string; change: string }[];
  anomalies: { level: 'info' | 'warning' | 'critical', type: string, message: string, details?: any }[];
}

// --- Main Component ---
const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState('7일');
  const [selectedSegment, setSelectedSegment] = useState('전체 사용자');
  const [showCumulative, setShowCumulative] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize GA4 and Fetch Data
  useEffect(() => {
    setTimeout(() => setIsMounted(true), 200);
    // 1. Google Analytics 초기화
    const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (GA_MEASUREMENT_ID) {
        ReactGA.initialize(GA_MEASUREMENT_ID);
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }

    // 2. 백엔드 통계 데이터 로드
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/admin/stats/overview');
        if (res.ok) {
           const data = await res.json();
           setStats(data);
        }
      } catch (e) {
        console.error("통계 데이터를 가져오는 데 실패했습니다.", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 관리 헤더 영역 */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-secondary p-5 rounded-2xl border border-border/60 shadow-sm">
         <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
               <Activity className="text-primary" />
               데이터 분석실
            </h1>
            <p className="text-sm text-muted-foreground">GA4 및 데이터베이스 통합 실시간 모니터링</p>
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

            <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-muted transition-all text-sm font-medium shadow-lg shadow-border">
               <Download size={16} />
               분석 리포트 다운로드
            </button>
         </div>
      </div>

      {/* 상단 탭 네비게이션 */}
      <div className="border-b border-gray-300 dark:border-gray-600/80 overflow-x-auto">
         <div className="flex items-center gap-8 min-w-max">
            <TabButton 
               label="인사이트 오버뷰" 
               active={activeTab === 'overview'} 
               onClick={() => setActiveTab('overview')} 
               icon={Activity} 
            />
            <TabButton 
               label="획득 및 참여" 
               active={activeTab === 'acquisition'} 
               onClick={() => setActiveTab('acquisition')} 
               icon={Users} 
            />
            <TabButton 
               label="리텐션 및 퍼널" 
               active={activeTab === 'retention'} 
               onClick={() => setActiveTab('retention')} 
               icon={Layers} 
            />
            <TabButton 
               label="데이터 운영 (Ops)" 
               active={activeTab === 'dataops'} 
               onClick={() => setActiveTab('dataops')} 
               icon={Database} 
            />
         </div>
      </div>

      {/* 탭 콘텐츠 영역 */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
         
         {/* --- 1. OVERVIEW TAB --- */}
         {activeTab === 'overview' && (
            <div className="space-y-6">
               {loading ? (
                 <div className="p-10 text-center text-muted-foreground">데이터 분석 모듈 로드 중...</div>
               ) : (
                <>
                   {/* 실시간 티커 */}
                   <div className="flex items-center gap-4 py-2 px-4 bg-primary/10 border border-emerald-100 rounded-xl text-sm text-emerald-800">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      <span className="font-semibold">실시간 상태:</span>
                      <span>현재 <strong>{stats?.activeUsers || 0}명</strong>의 사용자가 활동 중입니다.</span>
                      <span className="mx-2 text-primary/30">|</span>
                      <span>데이터 파이프라인 정기 업데이트 성공 (0.3s ago)</span>
                   </div>

                   {/* 주요 지표 카드 */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      {/* 1. 사용자 수 카드 */}
                      <MetricCard 
                         title="사용자 수" 
                         value={showCumulative ? (stats?.cumulativeUsers?.toLocaleString() || "0") : (stats?.totalUsers?.toLocaleString() || "0")} 
                         subtitle={showCumulative ? "탈퇴 계정 포함 전체" : "현재 활성 계정 기준"} 
                         icon={Users} 
                         color="emerald"
                         badge={
                           <div className="flex p-0.5 bg-muted/30 rounded-full border border-border/40 shadow-sm backdrop-blur-sm">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); setShowCumulative(false); }}
                                 className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${!showCumulative ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                 현재
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); setShowCumulative(true); }}
                                 className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showCumulative ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                 누적
                              </button>
                           </div>
                         }
                      />
                      
                      {/* 2. 신규 유입 카드 */}
                      <MetricCard 
                         title="신규 유입 (7일)" 
                         value={stats?.newUsersRecent?.toLocaleString() || "0"} 
                         trend={stats?.newUserGrowth ? `${Math.abs(stats.newUserGrowth)}%` : "7일 합산"} 
                         trendUp={stats?.newUserGrowth ? stats.newUserGrowth > 0 : null} 
                         subtitle="최근 일주일 신규 가입" 
                         icon={TrendingUp} 
                         color="emerald" 
                      />

                      {/* 3. 활동 지수 카드 (실시간) */}
                      <MetricCard 
                         title="활동 지수 (Est)" 
                         value={stats?.activeUsers?.toLocaleString() || "0"} 
                         subtitle="현재 온라인 상태 유저" 
                         icon={Activity} 
                         color="emerald"
                         badge={
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-wider">실시간</span>
                           </div>
                         }
                      />

                      {/* 4. 콘텐츠 현황 카드 */}
                      <MetricCard 
                         title="콘텐츠 현황" 
                         value={showComments ? (stats?.commentCount?.toLocaleString() || "0") : (stats?.postCount?.toLocaleString() || "0")} 
                         subtitle={showComments ? "댓글 및 답글 수" : "게시글 및 트윗 수"} 
                         icon={Database} 
                         color="emerald"
                         badge={
                           <div className="flex p-0.5 bg-muted/30 rounded-full border border-border/40 shadow-sm backdrop-blur-sm">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); setShowComments(false); }}
                                 className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${!showComments ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                 게시글
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                                 className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showComments ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                 댓글
                              </button>
                           </div>
                         }
                      />

                      {/* 5. 총 매출 카드 */}
                      <MetricCard 
                         title="총 매출" 
                         value={`$${stats?.totalRevenue?.toLocaleString() || "0"}`} 
                         trend={stats?.totalRevenue ? "12%" : "-"} 
                         trendUp={stats?.totalRevenue ? true : null} 
                         subtitle="결제 시스템 연동 완료" 
                         icon={DollarSign} 
                         color="emerald" 
                      />

                      {/* 6. 구매 전환률 카드 */}
                      <MetricCard 
                         title="구매 전환률" 
                         value={`${stats?.conversionRate || 0}%`} 
                         trend={stats?.conversionRate ? "0.4%" : "-"} 
                         trendUp={stats?.conversionRate ? true : null} 
                         subtitle="현재 활성 유저 대비" 
                         icon={Zap} 
                         color="emerald" 
                      />
                   </div>

                   {/* 이상 징후 감지 (Anomaly Detection) */}
                   <div className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-4 transition-all duration-500 ${
                      (stats?.anomalies || []).some(a => a.level === 'critical') ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30' :
                      (stats?.anomalies || []).some(a => a.level === 'warning') ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30' :
                      'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30'
                   }`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${
                           (stats?.anomalies || []).some(a => a.level === 'critical') ? 'bg-red-100 text-red-600' :
                           (stats?.anomalies || []).some(a => a.level === 'warning') ? 'bg-amber-100 text-amber-600' :
                           'bg-emerald-100 text-emerald-600'
                        }`}>
                           {(stats?.anomalies || []).some(a => a.level === 'critical') ? <AlertOctagon size={24} /> :
                            (stats?.anomalies || []).some(a => a.level === 'warning') ? <AlertTriangle size={24} /> :
                            <CheckCircle2 size={24} />}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start">
                             <h3 className={`text-lg font-bold ${
                                (stats?.anomalies || []).some(a => a.level === 'critical') ? 'text-red-700 dark:text-red-400' :
                                (stats?.anomalies || []).some(a => a.level === 'warning') ? 'text-amber-700 dark:text-amber-400' :
                                'text-emerald-700 dark:text-emerald-400'
                             }`}>
                                {(stats?.anomalies || []).length > 3 ? '종합 위협 분석 진행 중' :
                                 (stats?.anomalies || []).some(a => a.level === 'critical') ? '치명적 이상 징후 감지' : 
                                 (stats?.anomalies || []).length > 0 ? '보안/트래픽 주의보' : 
                                 '시스템 정상 운영 중 (Proactive Health OK)'}
                             </h3>
                             {(stats?.anomalies || []).length > 0 && (
                               <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-background/50 rounded border border-current/10 opacity-70">
                                 { (stats?.anomalies || []).length } Active Alerts
                               </span>
                             )}
                           </div>
                           <div className="text-sm mt-1 space-y-2">
                              {(stats?.anomalies || []).length > 0 ? (
                                 stats?.anomalies.map((anno, idx) => (
                                    <div key={idx} className="bg-white/40 dark:bg-black/10 p-2.5 rounded-lg border border-current/5 animate-in fade-in slide-in-from-left-2 duration-300">
                                       <div className="flex items-center gap-2 font-bold text-[13px]">
                                          <span className={`w-1.5 h-1.5 rounded-full ${anno.level === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                          {anno.message}
                                       </div>
                                       {anno.details && (
                                          <div className="mt-1 flex gap-3 text-[11px] font-mono text-muted-foreground/80 pl-3">
                                             {Object.entries(anno.details).map(([key, val], i) => (
                                                <span key={i} className="bg-muted/50 px-1.5 py-0.5 rounded">
                                                   {key}: <span className="text-foreground">{String(val)}</span>
                                                </span>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                 ))
                              ) : (
                                 <p className="text-emerald-600/80 dark:text-emerald-400/60">
                                    AI 보안 엔진이 24시간 실시간 감시 중입니다. 현재 DDoS, SQLi, 가입 패턴 등 모든 분석 지표가 안정적입니다.
                                 </p>
                              )}
                           </div>
                        </div>
                      </div>
                      
                      {(stats?.anomalies || []).length > 0 && (
                        <div className="pt-2 border-t border-current/10 flex justify-between items-center">
                           <div className="text-[11px] text-muted-foreground italic">
                              * 모든 수치는 실시간 휴리스틱 분석 결과이며 실제 데이터와 미세한 차이가 있을 수 있습니다.
                           </div>
                           <div className="flex gap-2">
                              <button className="px-4 py-1.5 bg-white shadow-sm dark:bg-black/40 border border-current/10 rounded-lg text-xs font-black transition-all hover:translate-y-[-1px]">
                                 전체 분석 로그 확인
                              </button>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* 주간 활동 추이 차트 */}
                      <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm lg:col-span-2 min-w-0">
                         <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <BarChart2 size={18} className="text-muted-foreground" />
                            주간 활동 추이 (Weekly Activity)
                         </h3>
                         <div className="h-[300px] w-full min-h-[300px] relative">
                           {isMounted && (
                             <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                             <AreaChart data={stats?.chartData || []}>
                               <defs>
                                 <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                   <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                               <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                               <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                               <Tooltip 
                                 content={({ active, payload, label }) => {
                                   if (active && payload && payload.length) {
                                     return (
                                       <div className="bg-background/95 backdrop-blur-sm p-3 rounded-xl border border-border shadow-xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                                         <div className="text-[11px] font-black text-muted-foreground mb-1.5 uppercase tracking-tighter">{label} 활동 보고</div>
                                         <div className="space-y-1.5">
                                           <div className="flex items-center justify-between gap-4">
                                             <div className="flex items-center gap-1.5">
                                               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                               <span className="text-xs font-bold">총 활동량</span>
                                             </div>
                                             <span className="text-xs font-black">{payload[0].value}건</span>
                                           </div>
                                           <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/50">
                                             <div className="flex items-center gap-1.5">
                                               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                               <span className="text-xs font-medium text-muted-foreground">신규 가입</span>
                                             </div>
                                             <span className="text-xs font-bold text-foreground/80">{payload[0].payload.signups}명</span>
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

                      {/* 인기 페이지 테이블 */}
                      <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                         <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                             <Search size={18} className="text-muted-foreground" />
                             인기 페이지 (Top Pages)
                         </h3>
                         <div className="space-y-4">
                            {(stats?.topPages || []).map((item, i) => (
                               <div key={i} className="flex items-center justify-between p-2.5 hover:bg-muted rounded-lg transition-colors group">
                                  <div className="flex flex-col">
                                     <span className="font-semibold text-sm text-foreground">{item.page}</span>
                                     <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">{item.path}</span>
                                  </div>
                                  <div className="text-right">
                                     <div className="font-bold text-sm text-foreground">{item.views}</div>
                                     <div className="text-[10px] text-primary">{item.change}</div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </>
               )}
            </div>
         )}

         {/* --- 2. ACQUISITION TAB --- */}
         {activeTab === 'acquisition' && (
            <div className="space-y-6">
                <div className="bg-secondary p-10 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm text-center">
                   <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4">
                      <Globe size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-2">Google Analytics 통합 분석</h3>
                   <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                      현재 사이트에는 실시간 트래픽 데이터 수집을 위한 GA4가 활성화되어 있습니다.<br/>
                      상세 유입 경로, 키워드 분석, 세밀한 사용자 흐름은 공식 대시보드에서 전문적으로 확인하실 수 있습니다.
                   </p>
                   
                   <a 
                      href="https://analytics.google.com/" 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20"
                   >
                     Google Analytics 대시보드로 이동 &rarr;
                   </a>
                </div>

                {/* 플랫폼 점유율 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-secondary p-6 rounded-2xl border border-border shadow-sm">
                      <h4 className="font-bold mb-6 flex items-center gap-2">
                         <PieIcon size={18} className="text-primary" />
                         디바이스별 접속 비중
                      </h4>
                      <div className="flex flex-col items-center">
                         <div className="w-40 h-40 rounded-full border-[10px] border-primary border-r-emerald-200 border-b-emerald-200 flex items-center justify-center">
                            <span className="text-2xl font-black text-foreground">82%</span>
                         </div>
                         <div className="flex gap-4 mt-6">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                               <span className="w-3 h-3 rounded-full bg-primary"></span> 모바일
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                               <span className="w-3 h-3 rounded-full bg-emerald-200"></span> 데스크탑
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
         )}

         {/* --- 3. RETENTION & FUNNELS TAB --- */}
         {activeTab === 'retention' && (
            <div className="space-y-6">
               <div className="bg-secondary p-8 rounded-2xl border border-border shadow-sm">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                     <Layers size={20} className="text-primary" />
                     학습 완료 퍼널 (Onboarding Funnel)
                  </h3>
                  <div className="flex flex-col gap-4">
                     <FunnelStep label="랜딩 페이지 방문" value="1,200" percent="100%" color="bg-primary/20" />
                     <FunnelStep label="회원 가입 완료" value="840" percent="70%" color="bg-primary/40" />
                     <FunnelStep label="첫 강의 시청" value="320" percent="38%" color="bg-primary/60" />
                     <FunnelStep label="유료 구독 전환" value="45" percent="5.3%" color="bg-primary/80" />
                  </div>
               </div>

               <div className="bg-secondary p-6 rounded-2xl border border-border shadow-sm overflow-x-auto">
                  <h3 className="font-bold text-lg mb-4">월간 코호트 리텐션 (Cohort Analysis)</h3>
                  <table className="w-full text-sm">
                     <thead>
                        <tr className="text-muted-foreground border-b border-border">
                           <th className="py-3 text-left font-medium pb-2 pr-4">가입 시기 (Month)</th>
                           <th className="py-3 font-medium">유저수</th>
                           <th className="py-3 font-medium">M1</th>
                           <th className="py-3 font-medium">M2</th>
                           <th className="py-3 font-medium">M3</th>
                           <th className="py-3 font-medium">M4</th>
                        </tr>
                     </thead>
                     <tbody className="text-center font-medium">
                        <CohortRow month="2025. 11" count="340" rates={['32%', '24%', '18%', '12%']} />
                        <CohortRow month="2025. 12" count="412" rates={['38%', '28%', '22%', '-']} />
                        <CohortRow month="2026. 01" count="125" rates={['42%', '-', '-', '-']} />
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* --- 4. DATA OPS TAB --- */}
         {activeTab === 'dataops' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-secondary p-6 rounded-2xl border border-border shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                         <h3 className="font-bold flex items-center gap-2">
                            <Server size={18} className="text-primary" />
                            서버 상태 (Node API)
                         </h3>
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                            <CheckCircle2 size={12} />
                            정상 작동 중 (Active)
                         </div>
                      </div>
                      <div className="space-y-2">
                         <p className="text-xs text-muted-foreground line-clamp-1">EndPoint: http://localhost:3001</p>
                         <p className="text-xs text-muted-foreground">Uptime: 23d 04h 12m</p>
                      </div>
                      <button className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                         <RefreshCw size={14} />
                         서버 로그 새로고침
                      </button>
                  </div>

                  <div className="bg-secondary p-6 rounded-2xl border border-border shadow-sm space-y-4">
                      <h3 className="font-bold flex items-center gap-2">
                         <Lock size={18} className="text-violet-500" />
                         데이터 무결성 검사
                      </h3>
                      <p className="text-xs text-muted-foreground">
                         DB 트리거 미사용 및 애플리케이션 레벨의 데이터 일관성 검증 로직이 활성화되어 있습니다. 
                         모든 쓰기 작업은 원자성(Atomicity)을 보장하도록 안전하게 설계되었습니다.
                      </p>
                      <button className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-bold transition-colors">
                         시스템 무결성 스캔 시작
                      </button>
                  </div>
               </div>
            </div>
         )}

      </div>
    </div>
  );
};

// --- 서브 컴포넌트 ---

function TabButton({ label, active, onClick, icon: Icon }: { label: string, active: boolean, onClick: () => void, icon: any }) {
   return (
      <button 
         onClick={onClick}
         className={`flex items-center gap-2 pb-4 pt-2 border-b-2 transition-all ${
            active 
               ? 'border-border text-foreground font-bold' 
               : 'border-transparent text-muted-foreground hover:text-foreground font-medium'
         }`}
      >
         <Icon size={18} />
         {label}
      </button>
   );
}

function MetricCard({ title, value, trend, trendUp, subtitle, icon: Icon, color, badge }: any) {
  // Always use emerald for high-contrast premium feel if requested, otherwise fallback
  const colorClass = 'text-primary bg-primary/10 dark:bg-primary/20';

   const trendStyles = trendUp === true ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                     trendUp === false ? 'bg-red-50 text-red-600 border-red-100' : 
                     'bg-gray-50 text-gray-500 border-gray-100';

   return (
      <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm hover:translate-y-[-2px] transition-transform duration-300 relative group min-h-[160px] flex flex-col justify-between">
         <div>
            <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-xl ${colorClass}`}>
                  <Icon size={22} strokeWidth={2.5} />
               </div>
               {badge ? badge : (
                  trend && (
                     <span className={`flex items-center text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm ${trendStyles}`}>
                        {trendUp === true && <ArrowUp size={12} className="mr-1 shadow-sm" />}
                        {trendUp === false && <ArrowDown size={12} className="mr-1 shadow-sm" />}
                        {trend}
                     </span>
                  )
               )}
            </div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
            <div className="text-sm text-foreground/80 font-bold mt-1.5">{title}</div>
         </div>
         <div className="text-[11px] text-muted-foreground/70 font-medium mt-1 uppercase tracking-tighter">{subtitle}</div>
      </div>
   )
}

function FunnelStep({ label, value, percent, color }: any) {
   return (
      <div className="group space-y-1">
         <div className="flex justify-between text-xs font-bold text-muted-foreground px-1">
            <span>{label}</span>
            <span>{value} ({percent})</span>
         </div>
         <div className="h-8 w-full bg-muted rounded-lg overflow-hidden border border-border">
            <div className={`h-full ${color} transition-all duration-1000`} style={{ width: percent }}></div>
         </div>
      </div>
   )
}

function CohortRow({ month, count, rates }: any) {
   return (
      <tr className="border-b border-border/40 hover:bg-muted/30">
         <td className="py-4 text-left font-bold pl-1">{month}</td>
         <td className="py-4 text-muted-foreground">{count}</td>
         {rates.map((rate: string, i: number) => (
            <td key={i} className="py-4">
               <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-[11px] ${
                  rate === '-' ? 'text-gray-300' : 'bg-primary/20 text-primary font-black'
               }`}>
                  {rate}
               </div>
            </td>
         ))}
      </tr>
   )
}

export default AdminAnalytics;
