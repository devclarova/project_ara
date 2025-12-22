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
    { title: '총 사용자', value: '12,345', change: '+12%', icon: Users, color: 'text-primary-500 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/30' },
    { title: '활성 세션', value: '1,234', change: '+5%', icon: Activity, color: 'text-primary dark:text-primary', bg: 'bg-primary/10 dark:bg-primary-900/30' },
    { title: '신규 가입', value: '432', change: '+18%', icon: TrendingUp, color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
    { title: '예상 수익', value: '$45,231', change: '+8%', icon: DollarSign, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  ];

  const recentUsers = [
    { name: 'Sarah Wilson', email: 'sarah@example.com', role: 'User', status: 'Active', date: '2분 전' },
    { name: 'Mike Johnson', email: 'mike@example.com', role: 'Editor', status: 'Offline', date: '15분 전' },
    { name: 'Emily Davis', email: 'emily@example.com', role: 'User', status: 'Active', date: '1시간 전' },
    { name: 'James Smith', email: 'james@example.com', role: 'Admin', status: 'Active', date: '3시간 전' },
    { name: 'Alex Clark', email: 'alex@example.com', role: 'User', status: 'Banned', date: '1일 전' },
  ];

  return (
    <div className="w-full min-w-[300px] space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Title Section */}
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">대시보드 개요</h1>
        <p className="text-sm sm:text-base text-muted-foreground break-words">안녕하세요, 오늘의 주요 현황입니다.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Chart & Activity Section (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
        {/* Main Chart Area (Placeholder) */}
        <div className="lg:col-span-2 bg-secondary rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">사용자 증가 추이</h2>
            <button className="p-1 hover:bg-accent rounded text-muted-foreground">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-64 flex items-end gap-2 px-2">
              {/* Creating some fake bars purely with css/divs for visual appeal without chart lib */}
              {[40, 65, 45, 80, 55, 90, 70].map((h, idx) => (
                <div key={idx} className="w-full bg-muted hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-t-lg relative group transition-colors cursor-pointer group">
                  <div 
                  className="absolute bottom-0 left-0 right-0 mx-auto w-4/5 bg-primary/80 dark:bg-primary/80 group-hover:bg-primary-500 dark:group-hover:bg-primary-600 rounded-t-md transition-all duration-500 ease-out"
                  style={{ height: `${h}%` }}
                  />
                </div>
              ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-muted-foreground px-2">
            <span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span>
          </div>
        </div>

        {/* Recent Users List */}
        <div className="bg-secondary rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm p-3 sm:p-4 md:p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">최근 접속 사용자</h2>
          <div className="space-y-4">
            {recentUsers.map((user, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate break-words">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate break-words">{user.email}</p>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{user.date}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-center text-primary hover:bg-primary/10 font-medium border border-gray-300 dark:border-gray-500 hover:border-primary/30 rounded-lg transition-colors">
            전체 사용자 보기
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminHome;
