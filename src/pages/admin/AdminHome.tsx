import React from 'react';
import { 
  Users, 
  Activity, 
  TrendingUp,
  DollarSign,
  MoreHorizontal,
} from 'lucide-react';

const AdminHome = () => {
  // Mock data for charts/stats
  const stats = [
    { title: '총 사용자', value: '12,345', change: '+12%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: '활성 세션', value: '1,234', change: '+5%', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: '신규 가입', value: '432', change: '+18%', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50' },
    { title: '예상 수익', value: '$45,231', change: '+8%', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const recentUsers = [
    { name: 'Sarah Wilson', email: 'sarah@example.com', role: 'User', status: 'Active', date: '2분 전' },
    { name: 'Mike Johnson', email: 'mike@example.com', role: 'Editor', status: 'Offline', date: '15분 전' },
    { name: 'Emily Davis', email: 'emily@example.com', role: 'User', status: 'Active', date: '1시간 전' },
    { name: 'James Smith', email: 'james@example.com', role: 'Admin', status: 'Active', date: '3시간 전' },
    { name: 'Alex Clark', email: 'alex@example.com', role: 'User', status: 'Banned', date: '1일 전' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Title Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">대시보드 개요</h1>
        <p className="text-slate-500">안녕하세요, 오늘의 주요 현황입니다.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
            <p className="text-sm text-slate-500">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Chart & Activity Section (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area (Placeholder) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">사용자 증가 추이</h2>
            <button className="p-1 hover:bg-slate-50 rounded text-slate-400">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-64 flex items-end gap-2 px-2">
              {/* Creating some fake bars purely with css/divs for visual appeal without chart lib */}
              {[40, 65, 45, 80, 55, 90, 70].map((h, idx) => (
                <div key={idx} className="w-full bg-slate-50 hover:bg-emerald-50 rounded-t-lg relative group transition-colors cursor-pointer group">
                  <div 
                  className="absolute bottom-0 left-0 right-0 mx-auto w-4/5 bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-md transition-all duration-500 ease-out"
                  style={{ height: `${h}%` }}
                  />
                </div>
              ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-400 px-2">
            <span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span>
          </div>
        </div>

        {/* Recent Users List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">최근 접속 사용자</h2>
          <div className="space-y-4">
            {recentUsers.map((user, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{user.date}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-center text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-100 hover:border-emerald-200 rounded-lg transition-colors">
            전체 사용자 보기
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminHome;
