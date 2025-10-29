// src\components\app-sidebar.tsx
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

import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
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
