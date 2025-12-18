import React from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

const AdminAnalytics = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">통계 및 분석 (Analytics)</h1>
        <p className="text-slate-500">
          Google Analytics 연동 데이터 및 서비스 주요 지표를 확인합니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} className="mr-1" /> +12%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">12,345</h3>
          <p className="text-slate-500 text-sm">일일 활성 사용자 (DAU)</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <Clock size={20} />
            </div>
            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} className="mr-1" /> +5.4%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">18m 32s</h3>
          <p className="text-slate-500 text-sm">평균 체류 시간</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <BookOpenIcon />
            </div>
             <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <ArrowDownRight size={14} className="mr-1" /> -2.1%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">85%</h3>
          <p className="text-slate-500 text-sm">학습 완주율</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} className="mr-1" /> +8.2%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">$45.2k</h3>
          <p className="text-slate-500 text-sm">이번 달 예상 수익</p>
        </div>
      </div>

      {/* Charts Section (Mock) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">주간 방문자 추이</h3>
            <button className="text-sm text-slate-500 hover:text-slate-800">지난 7일 ▼</button>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {[45, 52, 49, 62, 58, 71, 65].map((h, i) => (
              <div key={i} className="w-full bg-slate-50 rounded-t-xl relative group hover:bg-slate-100 transition-colors">
                <div 
                  className="absolute bottom-0 w-full bg-indigo-500/80 rounded-t-xl transition-all group-hover:bg-indigo-500"
                  style={{ height: `${h}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                    {h * 100} Users
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-400 px-4">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* User Distribution Map Mock */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">국가별 사용자 분포</h3>
          <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden group">
            <Globe size={64} className="text-slate-300 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-slate-500 font-medium">Google Analytics Map View</p>
            </div>
             {/* Fake dots */}
             <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
             <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> South Korea
              </span>
              <span className="font-medium">42%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> United States
              </span>
              <span className="font-medium">21%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Japan
              </span>
              <span className="font-medium">15%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> Others
              </span>
              <span className="font-medium">22%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function BookOpenIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  );
}

export default AdminAnalytics;
