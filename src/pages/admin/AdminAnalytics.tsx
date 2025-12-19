import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock, 
  Users, 
  TrendingUp, 
  Globe, 
  Activity, 
  AlertOctagon, 
  Database, 
  Server, 
  Filter, 
  Download,
  Calendar,
  Zap,
  Layers,
  BarChart2,
  PieChart,
  MousePointerClick,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import React, { useState } from 'react';

// --- Type Definitions ---
type Tab = 'overview' | 'acquisition' | 'retention' | 'dataops';

// --- Main Component ---
const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState('7일');
  const [selectedSegment, setSelectedSegment] = useState('전체 사용자');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Area: Control Room Style */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
         <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Activity className="text-emerald-500" />
               데이터 분석실
            </h1>
            <p className="text-sm text-slate-500">Google Analytics 4 및 내부 데이터 파이프라인 연동</p>
         </div>

         <div className="flex flex-wrap items-center gap-3">
            {/* Segment Filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
               <Filter size={16} className="text-slate-400" />
               <select 
                  className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer"
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
               >
                  <option>전체 사용자</option>
                  <option>자연 유입 (Organic)</option>
                  <option>결제 사용자 (Paid)</option>
                  <option>신규 가입자 (New)</option>
               </select>
            </div>

            {/* Date Range Picker (Mock) */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
               {['24시간', '7일', '30일', '90일', '1년', '전체'].map((range) => (
                  <button
                     key={range}
                     onClick={() => setDateRange(range)}
                     className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        dateRange === range 
                           ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' 
                           : 'text-slate-500 hover:text-slate-700 hover:text-slate-900'
                     }`}
                  >
                     {range}
                  </button>
               ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-medium shadow-lg shadow-slate-200">
               <Download size={16} />
               리포트 다운로드
            </button>
         </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200/80 overflow-x-auto">
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
               label="데이터 옵스" 
               active={activeTab === 'dataops'} 
               onClick={() => setActiveTab('dataops')} 
               icon={Database} 
            />
         </div>
      </div>

      {/* Tab Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
         
         {/* --- 1. OVERVIEW TAB --- */}
         {activeTab === 'overview' && (
            <div className="space-y-6">
               {/* Real-time Ticker */}
               <div className="flex items-center gap-4 py-2 px-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-sm text-emerald-800 animate-pulse">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold">실시간:</span>
                  <span>현재 <strong>128명</strong>의 사용자가 학습 중입니다.</span>
                  <span className="mx-2 text-emerald-300">|</span>
                  <span>방금 전 <strong>서울, 대한민국</strong>에서 신규 결제 발생 ($89.00)</span>
               </div>

               {/* North Star Metric Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard 
                     title="총 매출 (Total Revenue)" 
                     value="$45,231" 
                     trend="+12.5%" 
                     trendUp={true} 
                     subtitle="지난 기간 대비" 
                     icon={TrendingUp} 
                     color="emerald" 
                  />
                  <MetricCard 
                     title="월간 활성 사용자 (MAU)" 
                     value="12,345" 
                     trend="+5.2%" 
                     trendUp={true} 
                     subtitle="지난 기간 대비" 
                     icon={Users} 
                     color="blue" 
                  />
                  <MetricCard 
                     title="평균 세션 시간" 
                     value="18m 30s" 
                     trend="-2.1%" 
                     trendUp={false} 
                     subtitle="지난 기간 대비" 
                     icon={Clock} 
                     color="amber" 
                  />
                  <MetricCard 
                     title="구매 전환율 (CVR)" 
                     value="3.2%" 
                     trend="+0.8%" 
                     trendUp={true} 
                     subtitle="가입 후 결제 전환" 
                     icon={Zap} 
                     color="violet" 
                  />
               </div>

               {/* Anomaly Detection Alert */}
               <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex items-start gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl flex-shrink-0">
                     <AlertOctagon size={24} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-800">이상 징후 감지 (Anomaly Detected)</h3>
                     <p className="text-slate-600 mt-1 text-sm">
                        오늘 04:00 AM 경, <strong>인도(India) 지역</strong> 트래픽이 평소 대비 <strong>400% 급증</strong>했습니다. 
                        봇(Bot) 공격 가능성이 있으므로 트래픽 소스를 확인하세요.
                     </p>
                     <button className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700 hover:underline">
                        로그 상세 분석 &rarr;
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top Pages Mock */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart2 size={18} className="text-slate-400" />
                        인기 페이지 (Top Pages)
                     </h3>
                     <div className="space-y-4">
                        {[
                           { path: '/study/kdrama-101', page: 'K-Drama 필수 회화', views: '24.5k', change: '+12%' },
                           { path: '/payment/pricing', page: '요금제 안내', views: '18.2k', change: '+5%' },
                           { path: '/', page: '메인 랜딩', views: '15.1k', change: '-2%' },
                           { path: '/study/bts-lyrics', page: 'BTS 가사로 배우기', views: '12.8k', change: '+28%' },
                        ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group cursor-pointer">
                              <div className="flex items-center gap-3">
                                 <span className="text-sm font-mono text-slate-400 w-6">0{i+1}</span>
                                 <div>
                                    <p className="font-medium text-slate-800 group-hover:text-emerald-600 transition-colors">{item.page}</p>
                                    <p className="text-xs text-slate-500 font-mono">{item.path}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="font-bold text-slate-800">{item.views}</p>
                                 <p className={`text-xs ${item.change.startsWith('+') ? 'text-emerald-600' : 'text-slate-400'}`}>{item.change}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Device/OS Pie Chart Mock */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                         <PieChart size={18} className="text-slate-400" />
                         플랫폼 점유율
                     </h3>
                     <div className="flex flex-col items-center justify-center p-4">
                        <div className="relative w-48 h-48 rounded-full border-[16px] border-emerald-500 border-r-blue-500 border-b-amber-500 border-l-slate-200">
                           <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <span className="text-3xl font-bold text-slate-800">64%</span>
                              <span className="text-xs text-slate-500">모바일</span>
                           </div>
                        </div>
                        <div className="flex gap-4 mt-8 w-full justify-center">
                           <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> 모바일
                           </div>
                           <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                              <span className="w-3 h-3 rounded-full bg-blue-500"></span> 데스크탑
                           </div>
                           <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                              <span className="w-3 h-3 rounded-full bg-amber-500"></span> 태블릿
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* --- 2. ACQUISITION TAB --- */}
         {activeTab === 'acquisition' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-1">유입 경로 분석 (Traffic Sources)</h3>
                   <p className="text-sm text-slate-500 mb-6">사용자들이 어떤 경로를 통해 서비스에 방문했는지 분석합니다.</p>
                   
                   <div className="space-y-6">
                      {[
                        { label: '자연 검색 (Google/Naver)', val: 45, color: 'bg-emerald-500' },
                        { label: '소셜 미디어 (Insta/Tiktok)', val: 28, color: 'bg-violet-500' },
                        { label: '직접 방문 / 즐겨찾기', val: 15, color: 'bg-slate-400' },
                        { label: '유료 광고 (Paid Referrals)', val: 8, color: 'bg-amber-500' },
                        { label: '이메일 캠페인', val: 4, color: 'bg-blue-500' },
                      ].map((item, i) => (
                         <div key={i}>
                            <div className="flex justify-between text-sm mb-2">
                               <span className="font-medium text-slate-700">{item.label}</span>
                               <span className="font-bold text-slate-900">{item.val}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                               <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Country Map Mock */}
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                         <Globe className="text-blue-400" />
                         글로벌 유입 현황 (Global Traffic)
                      </h3>
                      <button className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">실시간 뷰</button>
                   </div>
                   
                   <div className="relative h-64 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-center">
                      <p className="text-slate-500 text-sm font-mono">[Interactive 3D Globe Visualization Placeholder]</p>
                      
                      {/* Fake data points */}
                      <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
                      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-ping"></div>
                      <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="text-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                         <p className="text-xs text-slate-400 mb-1">대한민국</p>
                         <p className="text-xl font-bold">42.8%</p>
                      </div>
                      <div className="text-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                         <p className="text-xs text-slate-400 mb-1">미국</p>
                         <p className="text-xl font-bold">18.2%</p>
                      </div>
                      <div className="text-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                         <p className="text-xs text-slate-400 mb-1">일본</p>
                         <p className="text-xl font-bold">12.5%</p>
                      </div>
                      <div className="text-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                         <p className="text-xs text-slate-400 mb-1">베트남</p>
                         <p className="text-xl font-bold">8.4%</p>
                      </div>
                   </div>
                </div>
            </div>
         )}

         {/* --- 3. RETENTION & FUNNELS TAB --- */}
         {activeTab === 'retention' && (
            <div className="space-y-6">
               {/* New Signups Funnel */}
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Filter size={18} className="text-slate-400" />
                     신규 유저 온보딩 퍼널 (Onboarding Funnel)
                  </h3>
                  
                  <div className="relative pt-8 pb-4">
                     {/* Connecting Line (Background) */}
                     <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0 hidden lg:block"></div>
                     
                     <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
                        {/* Step 1 */}
                        <div className="relative">
                           <FunnelCard 
                              step="01" 
                              label="방문 (Visit)" 
                              count="100%" 
                              value={15234} 
                              color="emerald" 
                              isFirst
                           />
                           {/* Arrow / Dropoff Badge positioned absolutely between columns for LG screens */}
                           <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-20 items-center justify-center">
                              <span className="bg-white border border-red-100 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                 이탈 -45%
                              </span>
                           </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                           <FunnelCard 
                              step="02" 
                              label="회원가입 (Sign Up)" 
                              count="55%" 
                              value={8378} 
                              color="blue" 
                           />
                           <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-20 items-center justify-center">
                              <span className="bg-white border border-red-100 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                 이탈 -20%
                              </span>
                           </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative">
                           <FunnelCard 
                              step="03" 
                              label="온보딩 완료" 
                              count="44%" 
                              value={6702} 
                              color="violet" 
                           />
                           <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-20 items-center justify-center">
                              <span className="bg-white border border-red-100 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                 이탈 -35%
                              </span>
                           </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative">
                           <FunnelCard 
                              step="04" 
                              label="첫 학습 시작" 
                              count="28%" 
                              value={4265} 
                              color="amber" 
                              isLast
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Retention Cohort Heatmap */}
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Layers size={18} className="text-slate-400" />
                     코호트 리텐션 (Cohort Retention)
                  </h3>
                  
                  <table className="w-full min-w-[600px] text-sm text-center border-collapse">
                     <thead>
                        <tr>
                           <th className="p-3 text-left font-medium text-slate-500">날짜</th>
                           <th className="p-3 font-medium text-slate-500">신규 유저</th>
                           <th className="p-3 font-medium text-slate-800 bg-slate-50">Day 1</th>
                           <th className="p-3 font-medium text-slate-800 bg-slate-50">Day 3</th>
                           <th className="p-3 font-medium text-slate-800 bg-slate-50">Day 7</th>
                           <th className="p-3 font-medium text-slate-800 bg-slate-50">Day 14</th>
                           <th className="p-3 font-medium text-slate-800 bg-slate-50">Day 30</th>
                        </tr>
                     </thead>
                     <tbody className="space-y-1">
                        <CohortRow date="12월 11일" users={245} data={[45, 38, 32, 28, 24]} />
                        <CohortRow date="12월 12일" users={312} data={[48, 40, 35, 30, 26]} />
                        <CohortRow date="12월 13일" users={289} data={[42, 35, 29, 25, 21]} />
                        <CohortRow date="12월 14일" users={450} data={[52, 45, 40, 36]} />
                        <CohortRow date="12월 15일" users={380} data={[50, 42, 38]} />
                        <CohortRow date="12월 16일" users={410} data={[55, 48]} />
                        <CohortRow date="12월 17일" users={520} data={[60]} />
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* --- 4. DATA OPS TAB --- */}
         {activeTab === 'dataops' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Pipeline Status */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Server size={18} className="text-slate-400" />
                        파이프라인 상태
                     </h3>
                     <div className="space-y-4">
                        <StatusIndicator label="이벤트 수집기 (Web)" status="정상 작동" />
                        <StatusIndicator label="이벤트 수집기 (App)" status="정상 작동" />
                        <StatusIndicator label="데이터 웨어하우스 (Sync)" status="처리 중" warning />
                        <StatusIndicator label="실시간 집계기" status="정상 작동" />
                     </div>
                  </div>

                  {/* Schema Registry */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Database size={18} className="text-slate-400" />
                        이벤트 스키마 (v1.4.2)
                     </h3>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                           <span className="text-sm font-mono text-slate-600">view_content</span>
                           <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">유효</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                           <span className="text-sm font-mono text-slate-600">click_payment</span>
                           <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">유효</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                           <span className="text-sm font-mono text-slate-600">custom_event_A</span>
                           <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">사용 중단</span>
                        </div>
                     </div>
                     <button className="text-sm text-blue-600 font-medium mt-4 hover:underline">전체 스키마 레지스트리 보기 &rarr;</button>
                  </div>
                  
                  {/* Backfill Controls */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <RefreshCw size={18} className="text-slate-400" />
                        데이터 백필 (Backfill)
                     </h3>
                     <p className="text-sm text-slate-500 mb-4">누락된 데이터나 스키마 변경 시 과거 데이터를 재처리합니다.</p>
                     
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                        <div className="flex justify-between mb-2">
                           <span className="text-xs font-bold text-slate-700">최근 작업: #BF-2024-12-01</span>
                           <span className="text-xs text-emerald-600 font-bold">완료됨</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full">
                           <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
                        </div>
                     </div>

                     <button className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm">
                        새 백필 작업 생성
                     </button>
                  </div>
               </div>
            </div>
         )}


      </div>
    </div>
  );
};

// --- Sub Components ---

function TabButton({ label, active, onClick, icon: Icon }: { label: string, active: boolean, onClick: () => void, icon: any }) {
   return (
      <button 
         onClick={onClick}
         className={`flex items-center gap-2 pb-4 pt-2 border-b-2 transition-all ${
            active 
               ? 'border-slate-900 text-slate-900 font-bold' 
               : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
         }`}
      >
         <Icon size={18} />
         {label}
      </button>
   );
}

function MetricCard({ title, value, trend, trendUp, subtitle, icon: Icon, color }: any) {
   const colorClass = {
      emerald: 'text-emerald-600 bg-emerald-50',
      blue: 'text-blue-600 bg-blue-50',
      amber: 'text-amber-600 bg-amber-50',
      violet: 'text-violet-600 bg-violet-50'
   }[color as string] || 'text-slate-600 bg-slate-50';

   return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:translate-y-[-2px] transition-transform duration-300">
         <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass}`}>
               <Icon size={22} />
            </div>
            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
               {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
               {trend}
            </span>
         </div>
         <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
         <p className="text-sm text-slate-500 font-medium mt-1">{title}</p>
         <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
   )
}

function FunnelCard({ step, label, count, value, color, isFirst, isLast }: any) {
   const colors: any = {
      emerald: { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
      blue: { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
      violet: { border: 'border-violet-500', text: 'text-violet-600', bg: 'bg-violet-50' },
      amber: { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
   };
   const theme = colors[color] || colors.emerald;

   return (
      <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group hover:-translate-y-1 transition-all duration-300 ${isLast ? 'bg-slate-50/50' : ''}`}>
         <div className={`absolute top-0 left-6 right-6 h-1 ${theme.border} rounded-b-lg opacity-80`}></div>
         
         <div className="flex justify-between items-start mb-3 mt-2">
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">STEP {step}</span>
            <div className={`p-1.5 rounded-full ${theme.bg} ${theme.text}`}>
               {color === 'emerald' && <Users size={14} />}
               {color === 'blue' && <MousePointerClick size={14} />}
               {color === 'violet' && <CheckCircle2 size={14} />}
               {color === 'amber' && <Zap size={14} />}
            </div>
         </div>

         <h4 className="text-sm font-bold text-slate-700 mb-1">{label}</h4>
         <div className="flex items-end gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900">{count}</span>
            <span className="text-xs text-slate-400 font-medium mb-1.5">({value.toLocaleString()})</span>
         </div>
      </div>
   );
}

function CohortRow({ date, users, data }: any) {
   // Helper for heat colors
   const getHeatColor = (val: number) => {
      if (val >= 50) return 'bg-emerald-500 text-white';
      if (val >= 40) return 'bg-emerald-400 text-white';
      if (val >= 30) return 'bg-emerald-300 text-white';
      if (val >= 20) return 'bg-emerald-200 text-emerald-900';
      return 'bg-emerald-50 text-emerald-900';
   };

   return (
      <tr className="border-b border-slate-50 hover:bg-slate-50/50">
         <td className="p-3 text-left font-mono text-slate-600">{date}</td>
         <td className="p-3 font-semibold text-slate-900">{users}</td>
         {data.map((val: number, i: number) => (
            <td key={i} className="p-1">
               <div className={`w-full py-2 rounded-md text-xs font-bold ${getHeatColor(val)}`}>
                  {val}%
               </div>
            </td>
         ))}
         {/* Fill empty cells */}
         {Array.from({ length: 5 - data.length }).map((_, i) => (
             <td key={`empty-${i}`} className="p-1"><div className="w-full py-2 bg-slate-50/50 text-slate-300 rounded-md text-xs">-</div></td>
         ))}
      </tr>
   );
}

function StatusIndicator({ label, status, warning }: any) {
   return (
      <div className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50">
         <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
            {status === 'Operational' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clock size={16} className="text-amber-500" />}
            {label}
         </span>
         <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            warning 
               ? 'bg-amber-100 text-amber-700 animate-pulse' 
               : 'bg-emerald-100 text-emerald-700'
         }`}>
            {status}
         </span>
      </div>
   )
}

export default AdminAnalytics;
