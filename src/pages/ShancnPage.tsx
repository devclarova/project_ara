import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react';
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// 👉 가져올 HomeFeed 관련 컴포넌트들
import TweetComposer from '@/components/feed/TweetComposer';
import TweetList from '@/components/feed/TweetList';
import SidebarRight from '@/components/layout/SidebarRight';

const mockTweets = [
  {
    id: '1',
    content: '오늘 React 공부를 시작했어요! 🎯 Hooks 너무 재밌네요.',
    image_url: null,
    created_at: '2025-10-22T08:30:00Z',
    like_count: 24,
    repost_count: 5,
    bookmark_count: 3,
    profiles: {
      nickname: '김수하',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sooha',
    },
  },
  {
    id: '2',
    content: '디자인 시스템 만들 때 Tailwind + shadcn/ui 조합이 정말 최고네요 🔥',
    image_url: 'https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&w=800',
    created_at: '2025-10-21T14:15:00Z',
    like_count: 57,
    repost_count: 12,
    bookmark_count: 9,
    profiles: {
      nickname: '홍민지',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Minji',
    },
  },
  {
    id: '3',
    content:
      '요즘 Supabase + React Query로 CRUD 구현 중인데, RLS 때문에 고생 중 😂 그래도 재밌어요.',
    image_url: null,
    created_at: '2025-10-20T10:00:00Z',
    like_count: 42,
    repost_count: 8,
    bookmark_count: 6,
    profiles: {
      nickname: '이도현',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dohyun',
    },
  },
  {
    id: '4',
    content: '새 프로젝트 레이아웃 완성! 사이드바 + 인셋 레이아웃으로 대시보드 느낌 살렸어요 ⚡',
    image_url: '',
    created_at: '2025-10-19T17:45:00Z',
    like_count: 81,
    repost_count: 23,
    bookmark_count: 14,
    profiles: {
      nickname: '박유나',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuna',
    },
  },
  {
    id: '5',
    content: 'AI 모델한테 “UX 디자이너의 하루”를 이미지로 만들어달라고 했더니, 커피만 마셔요 ☕😂',
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&w=800',
    created_at: '2025-10-18T09:00:00Z',
    like_count: 63,
    repost_count: 15,
    bookmark_count: 10,
    profiles: {
      nickname: '최은지',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eunji',
    },
  },
];

// ----------------------------
// SiteHeader
// ----------------------------
export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">Home</h1>
      </div>
    </header>
  );
}

// ----------------------------
// NavUser
// ----------------------------
function NavUser({
  user,
  onLogout,
}: {
  user: { name: string; email: string; avatar: string };
  onLogout: () => void;
}) {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onLogout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ----------------------------
// Mock 로그인 폼
// ----------------------------
function LoginForm({ onLogin }: { onLogin: (user: any) => void }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser = {
      name: '김수하',
      email: 'soohastudy@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sooha',
    };

    if (id === 'test' && pw === '1234') {
      onLogin(mockUser);
    } else {
      alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full px-3 py-4">
      <input
        type="text"
        placeholder="아이디"
        value={id}
        onChange={e => setId(e.target.value)}
        className="w-full rounded-md border px-2 py-1 text-sm"
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={pw}
        onChange={e => setPw(e.target.value)}
        className="w-full rounded-md border px-2 py-1 text-sm"
      />
      <button
        type="submit"
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/80 transition"
      >
        로그인
      </button>
    </form>
  );
}

// ----------------------------
// Sidebar 항목
// ----------------------------
const items = [
  { title: 'Home', url: '#', icon: Home },
  { title: 'Inbox', url: '#', icon: Inbox },
  { title: 'Calendar', url: '#', icon: Calendar },
  { title: 'Search', url: '#', icon: Search },
  { title: 'Settings', url: 'profile', icon: Settings },
];

// ----------------------------
// ShancnPage
// ----------------------------
const ShancnPage = () => {
  const [user, setUser] = useState<any | null>(null);
  const handleLogin = (mockUser: any) => setUser(mockUser);
  const handleLogout = () => setUser(null);

  // ✅ 게시물 mock 처리
  const [tweets, setTweets] = useState<any[]>(mockTweets);
  const handleAddTweet = async (content: string) => {
    const newTweet = {
      id: Date.now().toString(),
      content,
      image_url: null,
      created_at: new Date().toISOString(),
      like_count: 0,
      repost_count: 0,
      bookmark_count: 0,
      profiles: { nickname: user?.name || '익명', avatar_url: user?.avatar },
    };
    setTweets(prev => [newTweet, ...prev]);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>테스트 로고</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {user ? (
            <NavUser user={user} onLogout={handleLogout} />
          ) : (
            <LoginForm onLogin={handleLogin} />
          )}
        </SidebarFooter>
      </Sidebar>

      {/*  HomeFeed 콘텐츠 삽입 */}
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex flex-row flex-1 rounded-xl md:min-h-min max-w-[1200px] mx-auto">
            <main className="flex-1 min-h-screen [@media(min-width:1100px)]:border-r border-gray-200 max-w-[700px]">
              <TweetComposer onPost={handleAddTweet} />
              <TweetList tweets={tweets} />
            </main>
            <SidebarRight />
          </div>
        </div>

        {/* <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3 max-w-[1200px] mx-auto w-full">
            <div className="md:col-span-2 bg-muted/50 rounded-xl">
              <main className="flex-1 min-h-screen border-r border-gray-200 max-w-[700px] mx-auto">
                <TweetComposer onPost={handleAddTweet} />
                <TweetList tweets={tweets} />
              </main>
            </div>
            <SidebarRight />
          </div>
        </div> */}

        
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ShancnPage;
