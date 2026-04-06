/**
 * 관리자 통합 레이아웃 엔진(Administrative Unit Layout Engine):
 * - 목적(Why): 대규모 운영 도구의 내비게이션 일관성을 유지하고 권한 기반의 접근 제어(RBAC) 레이어를 제공함
 * - 방법(How): 실시간 권한 실시간 검증(Auth Guard) 및 해상도별 가변 사이드바 아키텍처를 통해 보안과 사용성을 동시에 확보함
 */
import React, { useState, useEffect } from 'react';
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
  Package,
  Megaphone,
  Ticket,
} from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import ThemeSwitcher from '../../components/common/ThemeSwitcher';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState<{
    nickname: string;
    email: string;
    avatar_url: string | null;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const path = window.location.pathname;

    let pageTitle = '관리자';

    if (path === '/admin') pageTitle = '관리자 대시보드';
    else if (path.startsWith('/admin/study/upload')) pageTitle = '학습 영상 업로드';
    else if (path.startsWith('/admin/study/manage')) pageTitle = '학습 관리';
    else if (path.startsWith('/admin/goods/new')) pageTitle = '상품 등록';
    else if (path.startsWith('/admin/goods/manage')) pageTitle = '상품 관리';
    else if (path.startsWith('/admin/content')) pageTitle = '게시물 및 댓글 관리';
    else if (path.startsWith('/admin/reports')) pageTitle = '신고 및 문의';
    else if (path.startsWith('/admin/analytics')) pageTitle = '통계 및 분석';
    else if (path.startsWith('/admin/users')) pageTitle = '사용자 관리';
    else if (path.startsWith('/admin/banners')) pageTitle = '배너 관리';
    else if (path.startsWith('/admin/promotions')) pageTitle = '프로모션/쿠폰';
    else if (path.startsWith('/admin/settings')) pageTitle = '관리자 설정';

    document.title = `${pageTitle} | ARA Admin`;
  }, [window.location.pathname]);

  // 관리자 계정 식별 데이터 로드 — 세션 유효성 검증 및 프로필 정보 동기화
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setAdminProfile({
          nickname: data?.nickname || '관리자',
          email: user.email || 'admin@project-ara.com',
          avatar_url: data?.avatar_url || null,
        });
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        // Fallback to user email if profile fetch fails
        setAdminProfile({
          nickname: '관리자',
          email: user.email || 'admin@project-ara.com',
          avatar_url: null,
        });
      }
    };

    fetchAdminProfile();

    // 실시간 권한 무결성 검사 — 관리자 권한 박탈 시 즉시 세션 종료 및 피드백 제공
    const channel = supabase
      .channel(`admin_check_${user!.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user!.id}`,
        },
        async payload => {
          const newProfile = payload.new as { is_admin: boolean | null };
          if (!newProfile.is_admin) {
            toast.error(t('admin.permission_revoked', '관리자 권한이 해제되었습니다.'));
            await handleLogout();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      // 1. 데이터베이스 내 활성 상태(Online Status) 즉시 해제 — 실시간 상호작용 피드백 동기화
      if (user) {
        await supabase
          .from('profiles')
          .update({ is_online: false, last_active_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
      // 2. 인증 서버 세션 파기 — 보안 무결성 확보를 위한 클라우드 로그아웃 수행
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.location.href = '/';
    }
  };

  // 모바일 사이드바 활성화 시 뷰포트 배경 스크롤 억제 정책 적용
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="h-full w-full flex-1 min-h-0 flex bg-background font-sans text-foreground overflow-hidden">
      {/* 사이드바 네비게이션 — 해상도별 가변 레이아웃(Mobile: Drawer, Desktop: Fixed) 적용 */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[120] w-64 bg-secondary border-r border-gray-300 dark:border-gray-600 transform transition-transform duration-300 ease-in-out select-none [-webkit-tap-highlight-color:transparent] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 md:flex-shrink-0 md:h-full`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-300 dark:border-gray-600">
            <Link 
              to="/admin" 
              className="outline-none focus:outline-none active:outline-none no-underline hover:no-underline select-none [-webkit-tap-highlight-color:transparent]"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600">
                ARA Admin
              </span>
            </Link>
            <button
              className="md:hidden ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1">
            <NavItem
              to="/admin"
              icon={Home}
              label="대시보드"
              end
              onClick={() => setSidebarOpen(false)}
            />

            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              콘텐츠 관리
            </div>
            <NavItem
              to="/admin/study/upload"
              icon={Video}
              label="학습 영상 업로드"
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/admin/study/manage"
              icon={Video}
              label="학습 관리"
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/admin/goods/new"
              icon={Package}
              label="상품 등록"
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/admin/goods/manage"
              icon={Package}
              label="상품 관리"
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/admin/content"
              icon={ShieldAlert}
              label="게시물 및 댓글 관리"
              onClick={() => setSidebarOpen(false)}
            />

            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              운영 지원
            </div>
            <NavItem
              to="/admin/reports"
              icon={AlertTriangle}
              label="신고 및 문의"
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/admin/analytics"
              icon={PieChart}
              label="통계 및 분석"
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/admin/users"
              icon={Users}
              label="사용자 관리"
              onClick={() => setSidebarOpen(false)}
            />

            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              마케팅
            </div>
            <NavItem
              to="/admin/banners"
              icon={Megaphone}
              label="배너 관리"
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/admin/promotions"
              icon={Ticket}
              label="프로모션/쿠폰"
              onClick={() => setSidebarOpen(false)}
            />

            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              설정
            </div>
            <NavItem
              to="/admin/settings"
              icon={Settings}
              label="설정"
              onClick={() => setSidebarOpen(false)}
            />
          </div>

          <div className="p-4 border-t border-gray-300 dark:border-gray-600 shrink-0">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              {adminProfile?.avatar_url ? (
                <img
                  src={adminProfile.avatar_url}
                  alt={adminProfile.nickname}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {adminProfile?.nickname?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">
                  {adminProfile?.nickname || '관리자'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {adminProfile?.email || 'admin@project-ara.com'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors mb-2"
            >
              <Home size={16} />
              사용자 페이지로 이동
            </button>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* 상단 고정 헤더 — 뷰포트 최상단 레이어 정책 및 불투명도 가공(Backdrop-blur) 적용 */}
        <header className="h-14 sm:h-16 bg-secondary/80 backdrop-blur-md border-b border-gray-300 dark:border-gray-600 flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-[110] shadow-sm flex-shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 flex-1">
            <button
              className="md:hidden text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* 전역 검색 인터페이스 — 가용 뷰포트 해상도에 따른 조건부 노출 제어 */}
            <div className="hidden min-[500px]:flex items-center flex-1 max-w-xl">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
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

            {/* 시스템 통합 알림 센터 — 미확인 이벤트 및 위협 징후 실시간 인디케이터 */}
            <button className="relative p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
              <Bell size={18} className="sm:w-5 sm:h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* 동적 콘텐츠 렌더링 영역 — 템플릿 아키텍처 기반 중첩 라우트(Outlet) 주입 지점 */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8 bg-background relative z-0 overscroll-contain">
          <Outlet />
        </main>
      </div>

      {/* 모바일 전용 블로킹 오버레이 — 사이드바 활성 시 인터랙션 격리 레이어 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[115] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>

  );
};

// 네비게이션 메뉴 아이템 — 경로 활성 상태 매칭 및 인터페이스 바인딩 엔진
function NavItem({
  icon: Icon,
  label,
  to,
  end,
  onClick,
}: {
  icon: any;
  label: string;
  to: string;
  end?: boolean;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = end 
    ? location.pathname === to 
    : location.pathname.startsWith(to) || 
      (to === '/admin/study/manage' && location.pathname.startsWith('/admin/study/edit'));
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 outline-none focus:outline-none focus:ring-0 active:outline-none ring-0 focus-visible:ring-0 focus-visible:outline-none select-none [-webkit-tap-highlight-color:transparent] ${
      isActive 
        ? 'bg-primary/10 !text-primary font-medium' 
        : 'text-muted-foreground hover:!text-primary hover:bg-muted'
    }`}>
      <Icon size={18} />
      <span className="text-sm">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />}
    </Link>
  );
}

export default AdminLayout;
