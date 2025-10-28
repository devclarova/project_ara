// src/pages/SevenShad.tsx
import { AppSidebar } from '@/components/app-sidebar';
import SidebarRight from '@/components/layout/SidebarRight';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';

export default function TestSevenShad() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold text-foreground">피드</h1>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex flex-1 flex-col bg-muted/30">
          <div className="container mx-auto flex justify-center gap-8 px-6 py-10">
            {/* 중앙 콘텐츠 */}
            <div className="content flex-1 max-w-[700px] bg-background border border-border rounded-2xl shadow-sm px-6 py-8">
              <Outlet />
            </div>

            {/* 오른쪽 사이드 */}
            <div className="header-container w-[320px] shrink-0 hidden lg:block">
              <div className="sticky top-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border shadow-sm px-4 py-5">
                <SidebarRight />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
