import React, { useState } from 'react';
import { 
  BarChart, 
  Users, 
  Settings, 
  LogOut, 
  Home, 
  Search, 
  Bell, 
  MoreHorizontal,
  TrendingUp,
  Activity,
  DollarSign,
  Menu,
  X,
  Video,
  AlertTriangle,
  ShieldAlert,
  PieChart
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminHome = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <Link to="/admin" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600">
              Ara Admin
            </Link>
            <button 
              className="md:hidden ml-auto text-slate-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <NavItem to="/admin" icon={Home} label="대시보드" />
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">콘텐츠 관리</div>
            <NavItem to="/admin/study/upload" icon={Video} label="학습 영상 업로드" />
            <NavItem to="/admin/content" icon={ShieldAlert} label="콘텐츠 중재" />
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">운영 지원</div>
            <NavItem to="/admin/reports" icon={AlertTriangle} label="신고 및 문의" />
            <NavItem to="/admin/analytics" icon={PieChart} label="통계 및 분석" />
            <NavItem to="/admin/users" icon={Users} label="사용자 관리" />
            
             <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">설정</div>
            <NavItem to="/admin/settings" icon={Settings} label="설정" />
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">A</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">관리자</p>
                <p className="text-xs text-slate-500 truncate">admin@project-ara.com</p>
              </div>
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700 p-1"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden md:block w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="검색..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-0 rounded-lg text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* content scroll area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
           {/* If route is exactly /admin, show dashboard widgets. Otherwise outlet/children logic is usually handled by Router, 
               but here we are currently directing routes to separate page components.
               So AdminHome is ONLY the dashboard homepage. 
               Wait, the previous implementation had AdminHome as a standalone page. 
               The Sidebar needs to be consistent across pages. 
               Ideally I should have made an AdminLayout. 
               For now, I will keep AdminHome as JUST the dashboard content, 
               and I'll copy the Sidebar/Header code to a Layout component OR 
               just let AdminHome be the layout wrapping children?
               
               Re-reading my plan: I intended to keep them separate for simplicity or make a layout.
               Given the user wants "Verified Beautiful", consistent layout is key.
               
               Strategy Update:
               I will extract the Layout part (Sidebar + Header) into a Wrapper, 
               but to avoid refactoring EVERYTHING right now, I will just make AdminHome 
               render the passed children OR the dashboard widgets.
           */}
           
           <div className="max-w-7xl mx-auto space-y-8">
            
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
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Subcomponent for nav items
function NavItem({ icon: Icon, label, to }: { icon: any, label: string, to: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${
      isActive 
        ? 'bg-emerald-50 text-emerald-600 font-medium' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}>
      <Icon size={18} />
      <span className="text-sm">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
    </Link>
  );
}

export default AdminHome;
