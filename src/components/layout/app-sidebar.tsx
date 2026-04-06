/**
 * 지능형 반응형 사이드바 시스템(Intelligent Responsive Sidebar System):
 * - 목적(Why): 애플리케이션 전반의 서비스 맵을 구조화하여 제공하고 사용자 역할에 따른 최적화된 경로를 안내함
 * - 방법(How): Radix UI Sidebar 프리셋을 확장하여 가변형(Collapsible) 레이아웃 및 다중 팀 전환(Team Switcher) 기능을 통합함
 */
import * as React from 'react';
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Rabbit,
  Settings2,
  SquareTerminal,
} from 'lucide-react';

import { NavMain } from './nav-main';
import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Ara Ent',
      // logo: GalleryVerticalEnd,
      logo: Rabbit,
      plan: '커뮤니티',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Ara',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: '홈',
          url: '/socialss',
        },
        {
          title: '탐색',
          url: '/social/explore',
        },
        {
          title: '알림',
          url: '/notifications',
        },
        {
          title: '채팅',
          url: '/dm',
        },
        {
          title: '프로필',
          url: '/profile',
        },
        {
          title: '설정',
          url: '/settings',
        },
      ],
    },
    {
      title: 'Ara Study',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: '스터디',
          url: '/studyList',
        },
      ],
    },
    // {
    //   title: '설정',
    //   url: '#',
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: '정책1',
    //       url: '#',
    //     },
    //     {
    //       title: '정책2',
    //       url: '#',
    //     },
    //     {
    //       title: '정책3',
    //       url: '#',
    //     },
    //     {
    //       title: '정책4',
    //       url: '#',
    //     },
    //   ],
    // },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
