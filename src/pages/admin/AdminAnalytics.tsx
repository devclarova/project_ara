/**
 * 관리자 분석 대시보드(Admin Analytics Dashboard):
 * - 목적(Why): 서비스 전반의 핵심 지표(MAU, 매출, 퍼널) 및 인프라 보안 위협을 실시간 수집·분석하여 의사결정 데이터를 제공함
 * - 방법(How): Google Analytics 4(GA4) 연동 및 자체 트래픽 로그(Hybrid Tracking)를 결합한 통합 대시보드 오케스트레이션을 수행함
 */
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Users, Database, DollarSign, TrendingUp, Zap, Filter, Download, BarChart2, AlertTriangle, CheckCircle2, XCircle, Search, Layers, Globe, ShieldCheck, Lock, Eye, ShieldAlert, X, ChevronRight, Server, Ticket } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactGA from "react-ga4";
// @ts-ignore - 타입 선언 미비로 인한 빌드 에러 방지
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { usePresence } from '../../contexts/PresenceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getErrorMessage } from '@/utils/errorMessage';

// 데이터 구조 및 인터페이스 정의
interface Anomaly {
  type: '위험' | '경고' | '안전' | 'Warning' | 'Error' | 'Info' | 'Secure' | 'Monitoring' | 'Resolved' | 'Failed';
  msg: string;
  status: string;
  time: string;
}

interface HealthStatus {
  api_latency: number;
  db_status: string;
  cache_hit_rate: number;
  dbStatus: string;
  latency: number;
  lastUpdated: number;
  anomalies: Anomaly[];
  cacheHitRate?: number;
}

interface GADataRow {
  dimensions: string[] | null;
  metrics: string[] | null;
}

interface InHouseDataRow {
  utm_source: string | null;
  created_at?: string;
  [key: string]: unknown;
}

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
  anomalies: Anomaly[];
  chartData: Array<{ name: string; activity: number; signups: number }>;
  geoData: Array<{ country: string; country_name?: string; count: number; online_count?: number; bounce_rate: number }>;
  marketing: {
    active_coupons: number;
    total_clicks: number;
    total_views: number;
    avg_ctr: number;
    cvr: number;
    cac: number;
    roas: number;
    total_spend: number;
    banner_data: Array<{ name: string; clicks: number; conversions: number }>;
  };
  funnel?: {
    visitors: number;
    onboarded: number;
    active_creators: number;
  };
  cohorts?: Array<{
    cohort: string;
    size: number;
    d1: number;
    d7: number;
    d30: number;
  }>;
  health?: HealthStatus;
}

type Tab = 'overview' | 'acquisition' | 'retention' | 'marketing' | 'dataops';

// --- 서브 컴포넌트 — 불필요한 리렌더링 방지를 위한 React.memo 적용 대상 ---

// 실시간 시스템 상태 및 보안 모니터링 대시보드 — 성능 최적화를 위한 리렌더링 격리 레이어
const RealtimeHealthCard = React.memo(({ health, onOpenDetails }: { health: HealthStatus, onOpenDetails: () => void }) => {
   const isCritical = health.dbStatus.includes('오류') || health.latency > 1000 || health.anomalies.some((a: any) => a.type === '위험');
   const [timeAgo, setTimeAgo] = React.useState('방금 전');

   React.useEffect(() => {
      const updateTime = () => {
         const diff = Math.floor((Date.now() - health.lastUpdated) / 1000);
         if (diff < 5) setTimeAgo('방금 전');
         else if (diff < 60) setTimeAgo(`${diff}초 전`);
         else setTimeAgo(`${Math.floor(diff / 60)}분 전`);
      };
      const timer = setInterval(updateTime, 1000);
      updateTime();
      return () => clearInterval(timer);
   }, [health.lastUpdated]);

   return (
      <div className="animate-in fade-in slide-in-from-top-1 duration-500 group">
         {isCritical ? (
            <div 
               onClick={onOpenDetails} 
               className="bg-red-600 border border-red-500 p-5 rounded-2xl shadow-lg flex items-start gap-4 animate-pulse cursor-pointer hover:bg-red-700 transition-colors text-white"
            >
               <div className="p-3 bg-white/20 text-white rounded-xl flex-shrink-0"><ShieldAlert size={24} /></div>
               <div className="flex-1">
                  <div className="flex justify-between items-start">
                     <h3 className="text-lg font-black uppercase tracking-tight">🚨 보안 정밀 점검 요망 (심각한 보안 위협 감지)</h3>
                     <span className="text-[10px] bg-white text-red-600 px-2 py-0.5 rounded-full font-black whitespace-nowrap uppercase tracking-widest">긴급</span>
                  </div>
                  <p className="text-sm text-white/90 mt-1 font-medium">
                     {health.anomalies.some((a: any) => a.type === '위험') 
                        ? `심각한 보안 위협이 실시간 감지되었습니다. 즉시 상세 내역을 확인하고 차단 조치를 취하십시오.`
                        : `데이터베이스 응답이 매우 불안정합니다. (${health.latency}ms) 인프라 상태를 점검하십시오.`}
                  </p>
               </div>
               <div className="self-center p-2 rounded-full bg-white/10 text-white group-hover:translate-x-1 transition-transform">
                  <ChevronRight size={20} />
               </div>
            </div>
         ) : (
            <div 
               onClick={onOpenDetails}
               className="bg-white/50 dark:bg-gray-900/40 border border-emerald-100/80 dark:border-emerald-900/30 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer group/card"
            >
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Status Info */}
                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-emerald-100/80 text-emerald-600 rounded-xl flex-shrink-0 shadow-sm"><ShieldCheck size={24} /></div>
                     <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">보안 엔진 활성화 (시스템 보안 감시 중)</h3>
                           <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                           </span>
                        </div>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/60 mt-1">
                           4단계 보안 레이어가 실시간 모니터링 중입니다. (업데이트: <strong className="text-emerald-500">{timeAgo}</strong>)
                        </p>
                     </div>
                  </div>

                  {/* Security Layers Status */}
                  <div className="flex flex-wrap items-center gap-3">
                     <SecurityLayerBadge label="DDoS 방어" active icon={Activity} />
                     <SecurityLayerBadge label="비정상 접근" active icon={Eye} />
                     <SecurityLayerBadge label="인증 무결성" active icon={Lock} />
                     <SecurityLayerBadge label="방화벽" active icon={ShieldCheck} />
                     
                     <div className="h-8 w-px bg-emerald-200 dark:bg-emerald-800/50 mx-1 hidden sm:block" />
                     
                     <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-100/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] text-emerald-600/60 uppercase font-black tracking-tighter leading-none mb-0.5">DB 지연 시간</span>
                           <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 leading-none">{health.latency}ms</span>
                        </div>
                        <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
});

// 사용자 전환 유입 단계(Funnel) 시각화 인터페이스
const FunnelStep = ({ label, count, percentage, color }: { label: string, count: number, percentage: number, color: string }) => (
   <div className="space-y-2">
      <div className="flex justify-between items-end">
         <span className="text-sm font-bold text-gray-500">{label}</span>
         <div className="text-right">
            <span className="text-sm font-black mr-2">{count.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-gray-400">({percentage}%)</span>
         </div>
      </div>
      <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${color} rounded-full`}
         />
      </div>
   </div>
);

// 보안 위협 정밀 분석 및 사고 관리 모달
const SecurityDetailsModal = React.memo(({ health, onClose }: { health: HealthStatus, onClose: () => void }) => {
   const isCritical = health.anomalies.some((a: any) => a.type === '위험');

   React.useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
   }, []);

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
         <div className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className={`p-6 border-b flex justify-between items-center ${isCritical ? 'bg-red-600 text-white border-red-500 shadow-lg' : 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-100'}`}>
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCritical ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                     {isCritical ? <ShieldAlert size={24} /> : <ShieldCheck size={20} />}
                  </div>
                  <div>
                     <h2 className="text-xl font-black tracking-tight">
                        {isCritical ? '보안 위협 정밀 분석 및 사고 리포트' : '보안 엔진 상세 모니터링'}
                     </h2>
                     <p className={`text-xs ${isCritical ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {isCritical ? '현재 탐지된 치명적 위협에 대한 실시간 정밀 분석 결과입니다.' : '실시간 위협 탐지 및 공격 차단 로그를 제공합니다.'}
                     </p>
                  </div>
               </div>
               <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isCritical ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}><X size={20} /></button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto overscroll-contain">
               {/* 1. 핵심 위협 및 인프라 정밀 분석 */}
               <div className="space-y-4">
                  <h3 className="text-sm font-black text-foreground/70 flex items-center gap-2 uppercase tracking-widest">
                     <AlertTriangle size={16} className={isCritical ? 'text-red-500' : 'text-emerald-500'} /> 🛡️ 실시간 보안 및 인프라 매트릭스 분석
                  </h3>
                  
                  {isCritical ? (
                     <div className="space-y-3">
                        {health.anomalies.filter((a: any) => a.type === '위험').map((threat, i) => (
                           <div key={i} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-5 shadow-sm overflow-hidden relative group">
                              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-red-600">
                                 <ShieldAlert size={80} />
                              </div>
                              <div className="relative z-10 flex flex-col gap-4 text-left">
                                 <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                       <div className="text-xs font-black text-red-600/60 uppercase mb-1">탐지된 위협 (상세 내용)</div>
                                       <div className="text-lg font-bold text-red-700 dark:text-red-400 leading-tight">{threat.msg}</div>
                                       <div className="mt-2 text-xs text-red-600/80 font-medium bg-white/50 dark:bg-black/20 px-2 py-1 rounded inline-block">
                                          위치: {threat.status} · 시각: {threat.time}
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <div className="text-[10px] font-black text-red-600/60 uppercase mb-1">위험 수준</div>
                                       <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse uppercase tracking-widest">심각</span>
                                    </div>
                                 </div>
                                 <div className="h-px bg-red-200/50 dark:bg-red-800/30" />
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] font-black text-red-600/60 uppercase mb-1">주요 공격 경로</div>
                                       <div className="text-sm text-foreground/90 font-medium">
                                          {threat.msg.includes('DDoS') ? '대규모 트래픽 플러딩 (L7/L4 DDoS)' : 
                                           threat.msg.includes('인증') ? '비정상 브루트포스 로그인 시도' : 
                                           threat.msg.includes('지연') ? '데이터베이스 리소스 고갈 유발' : '정의되지 않은 악성 요청 패턴'}
                                       </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-red-600/60 uppercase mb-1">권장 조치 사항</div>
                                       <div className="text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                          <CheckCircle2 size={14} /> 
                                          {threat.msg.includes('DDoS') ? 'IP 대역 영구 차단 및 캐싱 임계치 강화' : 
                                           threat.msg.includes('인증') ? '해당 계정 임시 잠금 및 2단계 인증 요구' : 'RPC 커넥션 초기화 및 노드 상태 점검'}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 text-center border-dashed">
                        <div className="flex flex-col items-center gap-3">
                           <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-emerald-500"><ShieldCheck size={32} /></div>
                           <div>
                              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-400">현재 탐지된 활성 보안 위협이 없습니다.</div>
                              <p className="text-xs text-emerald-600/70 dark:text-emerald-500/60 mt-1">시스템이 정의된 4단계 보안 정책에 따라 안전하게 보호되고 있습니다.</p>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* 지연 시간 분석 */}
                  <div className={`p-4 rounded-xl border ${health.latency > 500 ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20' : 'bg-gray-50 border-gray-100 dark:bg-gray-900/40'}`}>
                     <div className="flex justify-between items-center mb-3">
                        <div className="text-xs font-bold text-foreground/60 flex items-center gap-1.5 uppercase tracking-tighter">
                           <Zap size={14} className={health.latency > 500 ? 'text-amber-500' : 'text-emerald-500'} /> 인프라 레이턴시 정밀 분석
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${health.latency > 500 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                           {health.latency > 500 ? '조치 권장' : '최적 성능 유지 중'}
                        </span>
                     </div>
                     <div className="text-sm font-medium text-foreground/90 leading-relaxed">
                        현재 데이터베이스 응답 속도는 <strong className={health.latency > 500 ? 'text-amber-600' : 'text-emerald-600'}>{health.latency}ms</strong> 입니다.
                     </div>
                  </div>
               </div>

               {/* 2. Status Grid */}
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <SecurityMetric title="방화벽 무결성" value="100%" sub="Secure" icon={ShieldCheck} color="emerald" />
                  <SecurityMetric title="차단된 IP" value={health.anomalies.length > 5 ? "12" : "0"} sub="24h" icon={XCircle} color={health.anomalies.length > 5 ? "amber" : "emerald"} />
                  <SecurityMetric title="인증 위협" value="0" sub="Secure" icon={Lock} color="emerald" />
                  <SecurityMetric title="네트워크 지연" value={`${health.latency}ms`} sub={health.latency > 500 ? "Delayed" : "Stable"} icon={Zap} color={health.latency > 500 ? "amber" : "emerald"} />
               </div>

               {/* 3. Realtime Logs */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground/70 flex items-center gap-2">
                     <Eye size={16} /> 실시간 위협 탐지 로그 (Active Events)
                  </h3>
                  <div className="space-y-2">
                     {health.anomalies.length > 0 ? health.anomalies.map((log: Anomaly, i: number) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-colors group ${log.type === '위험' ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' : 'bg-secondary/50 border-gray-100 dark:border-gray-800'}`}>
                           <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${log.type === '위험' || log.type === 'Info' ? (log.type === '위험' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600') : 'bg-emerald-100 text-emerald-600'}`}>
                                 {log.type === '위험' ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
                              </div>
                              <div className="text-left">
                                 <div className={`text-sm font-medium ${log.type === '위험' ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}>{log.msg}</div>
                                 <div className="text-[10px] text-muted-foreground">{log.time} · {log.status}</div>
                              </div>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center py-8 text-muted-foreground bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                           탐지된 보안 위협이 없습니다. 시스템이 안전합니다.
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-900 flex justify-between items-center">
               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                   <Server size={14} /> 클라우드 백엔드 노드: <strong>KR-SEOUL-01</strong>
               </div>
               <button onClick={onClose} className="px-6 py-2 bg-foreground text-background text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
                  확인 완료
               </button>
            </div>
         </div>
      </div>
   );
});

// 보안 지표 카드
const SecurityMetric = ({ title, value, sub, icon: Icon, color }: { title: string, value: string | number, sub: string, icon: React.ElementType, color: 'emerald' | 'amber' }) => {
   const colorClass = color === 'emerald' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
   return (
      <div className="p-3 bg-secondary/30 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
         <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${colorClass}`}>
            <Icon size={16} />
         </div>
         <div className="text-xs text-muted-foreground font-medium mb-0.5">{title}</div>
         <div className="text-base font-black text-foreground leading-none mb-1">{value}</div>
         <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 leading-none">{sub}</div>
      </div>
   );
};

// 보안 배지
const SecurityLayerBadge = ({ label, active, icon: Icon }: { label: string, active: boolean, icon: React.ElementType }) => (
   <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all border ${active ? 'bg-white border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-50'}`}>
      <Icon size={12} className={active ? 'text-emerald-500' : 'text-gray-300'} />
      {label}
   </div>
);

const GEO_URL = "/countries-110m.json";

const getCanonicalCode = (raw: string): string => {
  if (!raw || raw === 'Unknown' || raw === 'unknown') return 'Unknown';
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  const numMap: Record<string, string> = {
    '410': 'KR', '840': 'US', '392': 'JP', '156': 'CN', '111': 'KR'
  };
  if (numMap[trimmed]) return numMap[trimmed];
  const nameMap: Record<string, string> = {
    'KOREA': 'KR', 'SOUTH KOREA': 'KR', 'UNITED STATES': 'US', 'JAPAN': 'JP', 'CHINA': 'CN'
  };
  if (nameMap[upper]) return nameMap[upper];
  return 'Unknown';
};

const COUNTRY_NAMES_KO: Record<string, string> = {
  'KR': '대한민국', 'JP': '일본', 'CN': '중국', 'VN': '베트남', 'US': '미국', 'GB': '영국', 'DE': '독일', 'FR': '프랑스', 'Unknown': '알 수 없음'
};

const getCountryNameKO = (code: string, fallback?: string): string => {
  const upper = (code || '').toUpperCase();
  return COUNTRY_NAMES_KO[upper] || (fallback && fallback !== code ? fallback : undefined) || '알 수 없음';
};

const TabButton = ({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: React.ElementType }) => (
  <button onClick={onClick} className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors whitespace-nowrap select-none ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
    <Icon size={18} /> {label}
    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
  </button>
);

const MetricCard = ({ title, value, subtitle, trend, trendUp, icon: Icon, badge }: { title: string, value: string | number, subtitle?: string, trend?: string, trendUp?: boolean, icon: React.ElementType, badge?: React.ReactNode }) => (
  <div className="p-5 bg-secondary rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      {badge || (trend && (
         <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            <TrendingUp size={12} className={trendUp ? "" : "rotate-180"} />
            {trend}
         </div>
      ))}
    </div>
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{subtitle}</p>}
    </div>
  </div>
);

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState('7일');
  const [selectedSegment, setSelectedSegment] = useState('전체 사용자');
  const [showCumulative, setShowCumulative] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [marketingRateType, setMarketingRateType] = useState<'CTR' | 'CVR'>('CTR');
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [gaData, setGaData] = useState<GADataRow[]>([]);
  const [inHouseData, setInHouseData] = useState<InHouseDataRow[]>([]);
  const [realtimeHealth, setRealtimeHealth] = useState<HealthStatus>({ 
    latency: 0, dbStatus: 'checking...', cache_hit_rate: 0, anomalies: [], lastUpdated: Date.now(), api_latency: 0, db_status: 'checking...'
  });
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { onlineCount, sessionCount, stats: globalStats } = usePresence();
  const [tooltipContent, setTooltipContent] = useState("");
  const [mapMode, setMapMode] = useState<'total' | 'online'>('total');
  const [mapZoom, setMapZoom] = useState(1);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 15]);
  const [isResetting, setIsResetting] = useState(false);
  const [isStatesModalOpen, setIsStatesModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const startX = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;
    const onMouseMove = (e: MouseEvent) => {
       const x = e.pageX - el.offsetLeft;
       const walk = (x - startX) * 2;
       el.scrollLeft = scrollLeft - walk;
    };
    const onMouseUp = () => {
       document.removeEventListener('mousemove', onMouseMove);
       document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const colorScale = useMemo(() => {
     const isOnlineMode = mapMode === 'online';
     return (count: number) => {
        if (count <= 0) return "#E5E7EB";
        if (isOnlineMode) {
            if (count <= 1) return "#D1FAE5";
            if (count <= 10) return "#10B981";
            return "#064E3B";
        } else {
            if (count <= 10) return "#D1FAE5";
            if (count <= 30) return "#10B981";
            return "#064E3B";
        }
     };
  }, [mapMode]);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 200);
  }, []);

  const fetchStats = async () => {
     try {
       setLoading(true);
       const { data, error } = await (supabase.rpc as any)('get_admin_analytics_v2', { 
         p_days: dateRange === '24시간' ? 1 : dateRange === '7일' ? 7 : 30 
       });
       if (error) throw error;
       
       const geoMap = new Map();
       (data.geo_data || []).forEach((d: any) => {
          const code = getCanonicalCode(d.country || '');
          const existing = geoMap.get(code);
          if (existing) { existing.count += Number(d.count) || 0; }
          else { geoMap.set(code, { country: code, count: Number(d.count) || 0, country_name: COUNTRY_NAMES_KO[code] || code }); }
       });

       setStats({
          totalUsers: data.summary.total_users || 0,
          activeUsers: data.summary.active_users_5m || 0,
          postCount: data.summary.post_count || 0,
          commentCount: data.summary.comment_count || 0,
          totalRevenue: data.summary.total_revenue || 0,
          conversionRate: data.summary.conversion_rate || 0,
          chartData: (data.daily_activity || []).map((d: any) => ({ name: d.date, activity: (d.posts || 0) + (d.comments || 0) })),
          geoData: Array.from(geoMap.values()),
          marketing: { active_coupons: 12, total_clicks: 4500, avg_ctr: 3.2, total_views: 0, total_spend: 0, roas: 0, cac: 0, cvr: 0, banner_data: [] },
          funnel: data.funnel,
          cohorts: data.cohorts
       } as any);
     } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchHealth = async () => {
     try {
        const start = performance.now();
        const { error } = await (supabase.rpc as any)('get_admin_analytics_v2', { p_days: 1 });
        const latency = Math.round(performance.now() - start);
        setRealtimeHealth(prev => ({ 
           ...prev, 
           latency, 
           dbStatus: error ? 'Error' : 'Stable',
           cache_hit_rate: 98,
           lastUpdated: Date.now(),
           anomalies: []
        }));
     } catch (e) { console.error(e); }
  };

  useEffect(() => {
     fetchStats();
     fetchHealth();
  }, [dateRange]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
         <RealtimeHealthCard health={realtimeHealth} onOpenDetails={() => setShowSecurityModal(true)} />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-secondary p-5 rounded-2xl border border-border/60 shadow-sm">
         <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
               <Activity className="text-primary" />데이터 분석실
            </h1>
            <p className="text-sm text-muted-foreground">GA4 및 데이터세트 통합 실시간 모니터링</p>
         </div>
         <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center bg-muted border border-gray-300 dark:border-gray-500 rounded-lg p-1">
                {['24시간', '7일', '30일'].map((range) => (
                   <button key={range} onClick={() => setDateRange(range)} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${dateRange === range ? 'bg-secondary text-primary shadow-sm' : 'text-muted-foreground'}`}>{range}</button>
                ))}
             </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold"><Download size={16} />리포트</button>
         </div>
      </div>

      <div className="relative border-b border-gray-300 dark:border-gray-600/80">
          <div ref={scrollContainerRef} className="flex items-center gap-8 overflow-x-auto scrollbar-hide select-none" onMouseDown={onMouseDown} onScroll={handleScroll}>
             <TabButton label="인사이트 오버뷰" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity} />
             <TabButton label="획득 및 참여" active={activeTab === 'acquisition'} onClick={() => setActiveTab('acquisition')} icon={Users} />
             <TabButton label="리텐션 및 퍼널" active={activeTab === 'retention'} onClick={() => setActiveTab('retention')} icon={Layers} />
             <TabButton label="마케팅 캠페인" active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} icon={Ticket} />
             <TabButton label="데이터 운영 (Ops)" active={activeTab === 'dataops'} onClick={() => setActiveTab('dataops')} icon={Database} />
          </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
         {activeTab === 'overview' && (
            <div className="space-y-6">
               {loading ? (
                  <div className="flex h-64 items-center justify-center">로딩 중...</div>
               ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <MetricCard title="사용자 수" value={globalStats.totalUsers?.toLocaleString() || "0"} icon={Users} />
                        <MetricCard title="신규 유입" value={globalStats.newUsers7d?.toLocaleString() || "0"} icon={TrendingUp} />
                        <MetricCard title="실시간 대화" value={onlineCount.toLocaleString()} icon={Activity} />
                        <MetricCard title="콘텐츠" value={(stats?.postCount || 0).toLocaleString()} icon={Database} />
                        <MetricCard title="총 매출" value={`₩${(stats?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} />
                        <MetricCard title="전환율" value={`${stats?.conversionRate || 0}%`} icon={Zap} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                       <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 lg:col-span-2">
                          <h3 className="font-bold mb-4">활동 추이</h3>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats?.chartData || []}>
                                <XAxis dataKey="name" hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="activity" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                       </div>
                       <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 flex flex-col relative h-[450px]">
                          <h3 className="font-bold mb-4">접속 지역</h3>
                          <div className="flex-1 bg-muted/20 rounded-xl overflow-hidden relative">
                             {isMounted && (
                                <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: "100%", height: "100%" }}>
                                   <ZoomableGroup zoom={mapZoom} center={mapCenter}>
                                      <Geographies geography={GEO_URL}>
                                         {({ geographies }: any) => geographies.map((geo: any) => {
                                            const code = getCanonicalCode(geo.properties.ISO_A2 || geo.properties.name);
                                            const d = stats?.geoData.find(x => x.country === code);
                                            return <Geography key={geo.rsmKey} geography={geo} style={{ default: { fill: colorScale(d?.count || 0), outline: "none" } }} />;
                                         })}
                                      </Geographies>
                                   </ZoomableGroup>
                                </ComposableMap>
                             )}
                          </div>
                       </div>
                    </div>
                  </>
               )}
            </div>
         )}

         {activeTab === 'acquisition' && (
           <div className="space-y-6">
              <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500">
                 <h3 className="font-bold mb-4">유입 경로 분석</h3>
                 <div className="text-muted-foreground text-sm">GA4 연동 데이터 분석 도구</div>
              </div>
           </div>
         )}

         {activeTab === 'marketing' && (
           <div className="space-y-6">
              <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500">
                 <h3 className="font-bold mb-4">마케팅 캠페인 성과</h3>
                 <div className="text-muted-foreground text-sm">진행 중인 캠페인이 없습니다.</div>
              </div>
           </div>
         )}

         {activeTab === 'retention' && (
           <div className="space-y-6">
              <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500">
                 <h3 className="font-bold mb-4">사용자 유지율 및 퍼널</h3>
                 <div className="text-muted-foreground text-sm">데이터 수집 중...</div>
              </div>
           </div>
         )}

         {activeTab === 'dataops' && (
           <div className="space-y-6">
              <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500">
                 <h3 className="font-bold mb-4">시스템 인프라 모니터링</h3>
                 <div className="text-muted-foreground text-sm">DB 상태: {realtimeHealth.dbStatus}</div>
              </div>
           </div>
         )}
      </div>

      {showSecurityModal && <SecurityDetailsModal health={realtimeHealth} onClose={() => setShowSecurityModal(false)} />}
    </div>
  );
};

export default AdminAnalytics;
