// src\components\app-sidebar.tsx
import { useEffect, useState } from 'react';
import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

// profiles 테이블 타입에 맞게 지정
interface Profile {
  nickname: string | null;
  avatar_url: string | null;
  bio?: string | null;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user } = useAuth() as { user: User | null };
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);

      // ✅ user.id → profiles.user_id 기준으로 조회
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname, avatar_url, bio')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('프로필 불러오기 오류:', error.message);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // 로그인하지 않은 상태 → 로그인 버튼 표시
  if (!user) {
    return (
      <div className="p-4 text-sm text-muted-foreground flex flex-col items-center">
        {/* <p className="mb-2 text-gray-500">로그인하지 않았습니다</p> */}
        <Button
          onClick={() => navigate('/signin')}
          className="w-full bg-primary text-white hover:bg-primary/90"
        >
          로그인하기
        </Button>
      </div>
    );
  }

  if (loading || !profile) {
    return <div className="p-4 text-sm text-muted-foreground">Loading profile...</div>;
  }

  const displayName = profile.nickname || 'Unknown User';
  const email = user.email || 'No email';
  const avatarUrl = profile.avatar_url || '/avatars/default.png';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="rounded-lg">
                  {displayName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            {/* <DropdownMenuSeparator /> */}
            {/* <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup> */}

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <BadgeCheck />
                프로필
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => navigate('/')}>
                <Bell />
                알림
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
            >
              <LogOut />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
