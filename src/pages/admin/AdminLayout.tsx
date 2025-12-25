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
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import ThemeSwitcher from '../../components/common/ThemeSwitcher';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const AdminLayout = () => {
  const { t } = useTranslation();
  // Sidebar closed by default on mobile, will be open on desktop via CSS
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 먼저 리다이렉트하여 RequireAdmin 가드가 작동하기 전에 페이지 이동
      window.location.href = '/';
      // 백그라운드에서 로그아웃
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 발생해도 이미 리다이렉트되었으므로 토스트는 생략
    }
  };

  return (
    <div className="min-h-screen min-w-[300px] bg-background flex font-sans text-foreground overflow-x-hidden">
      {/* Sidebar - Hidden on mobile, always visible on desktop */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary border-r border-gray-300 dark:border-gray-600 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-300 dark:border-gray-600">
            <Link to="/admin" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600">
              ARA Admin
            </Link>
            <button 
              className="md:hidden ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>


          <div className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1">
            <NavItem to="/admin" icon={Home} label="대시보드" end />
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">콘텐츠 관리</div>
            <NavItem to="/admin/study/upload" icon={Video} label="학습 영상 업로드" />
            <NavItem to="/admin/study/manage" icon={Video} label="학습 관리" />
            <NavItem to="/admin/goods/new" icon={Package} label="상품 등록" />
            <NavItem to="/admin/goods/manage" icon={Package} label="상품 관리" />
            <NavItem to="/admin/content" icon={ShieldAlert} label="콘텐츠 중재" />
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">운영 지원</div>
            <NavItem to="/admin/reports" icon={AlertTriangle} label="신고 및 문의" />
            <NavItem to="/admin/analytics" icon={PieChart} label="통계 및 분석" />
            <NavItem to="/admin/users" icon={Users} label="사용자 관리" />
            
             <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">설정</div>
            <NavItem to="/admin/settings" icon={Settings} label="설정" />
          </div>

          <div className="p-4 border-t border-gray-300 dark:border-gray-600 shrink-0">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">A</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">관리자</p>
                <p className="text-xs text-muted-foreground truncate">admin@project-ara.com</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden md:ml-64">
        {/* Header */}
        <header className="h-14 sm:h-16 bg-secondary/80 backdrop-blur border-b border-gray-300 dark:border-gray-600 flex items-center justify-between px-2 sm:px-4 md:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 flex-1">
            <button 
              className="md:hidden text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* Search - Hidden on very small screens */}
            <div className="hidden min-[500px]:flex items-center flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="검색..."
                  className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-background border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* Theme Switcher */}
            <div className="scale-75 sm:scale-100 -mr-2 sm:mr-0">
              <ThemeSwitcher />
            </div>

            {/* Notifications */}
            <button className="relative p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
              <Bell size={18} className="sm:w-5 sm:h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 sm:p-4 md:p-6 lg:p-8 bg-background w-full max-w-full box-border">
            <Outlet />
        </main>
      </div>

      {/* Mobile Overlay - Only show on mobile when sidebar is open */}
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
  const isActive = end 
    ? location.pathname === to 
    : location.pathname.startsWith(to);
  
  return (
    <Link to={to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${
      isActive 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}>
      <Icon size={18} />
      <span className="text-sm">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />}
    </Link>
  );
}

export default AdminLayout;
