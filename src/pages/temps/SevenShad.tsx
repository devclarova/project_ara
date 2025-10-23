import { AppSidebar } from '@/components/app-sidebar';
import TweetList from '@/components/feed/TweetList';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function SevenShad() {
  const [tweets, setTweets] = useState<any[]>([]);

  // 초기 데이터 불러오기
  useEffect(() => {
    const fetchTweets = async () => {
      const { data, error } = await supabase
        .from('tweets')
        .select(
          `
          id,
          content,
          image_url,
          created_at,
          like_count,
          repost_count,
          bookmark_count,
          profiles:author_id (
            nickname,
            avatar_url
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      //else setTweets(data || []);
      else {
        console.log('🧩 Supabase fetched data:', data);
        setTweets(data || []);
      }
    };

    fetchTweets();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div> */}
          <div className="bg-muted/50 min-h-[100vh] max-w-[640px] mx-auto flex-1 rounded-xl md:min-h-min">
            <TweetList tweets={tweets} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
