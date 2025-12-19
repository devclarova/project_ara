import React, { useState } from 'react';
import { 
  BarChart, 
  Users, 
  Settings, 
  LogOut, 
  Home, 
  Search, 
  Bell, 
  Menu,
  X,
  Video,
  AlertTriangle,
  ShieldAlert,
  PieChart,
  Package
} from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
            <NavItem to="/admin" icon={Home} label="대시보드" end />
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">콘텐츠 관리</div>
            <NavItem to="/admin/study/upload" icon={Video} label="학습 영상 업로드" />
            <NavItem to="/admin/content" icon={ShieldAlert} label="콘텐츠 중재" />
            <NavItem to="/admin/goods/new" icon={Package} label="상품 등록" />
            
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

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Outlet />
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
function NavItem({ icon: Icon, label, to, end }: { icon: any, label: string, to: string, end?: boolean }) {
  const location = useLocation();
  // Simple active check logic
  // If end is true, exact match. Else, startsWith match.
  const isActive = end 
    ? location.pathname === to 
    : location.pathname.startsWith(to);
  
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

export default AdminLayout;
