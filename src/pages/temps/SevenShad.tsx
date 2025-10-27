import { AppSidebar } from '@/components/app-sidebar';
import TweetList from '@/components/feed/TweetList';
import SidebarRight from '@/components/layout/SidebarRight';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FFFBox from './FFFBox';

export default function SevenShad() {
  const [tweets, setTweets] = useState<any[]>([]);
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  // ✅ 프로필 정보 불러오기
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data);
      });
  }, [user]);

  // ✅ 초기 트윗 불러오기
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

      if (!error && data) setTweets(data);
    };
    fetchTweets();
  }, []);

  // ✅ 새 트윗 추가 시 즉시 UI 업데이트
  const handleAddTweet = (newTweet: any) => {
    setTweets(prev => [newTweet, ...prev]);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold text-gray-800">피드</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="container mx-auto flex justify-center gap-6 px-4 py-6">
            {/* 피드 영역 */}
            <div className="content flex-1 max-w-[700px] bg-muted/50 rounded-xl px-4 py-6">
              <FFFBox profile={profile} onPost={handleAddTweet} />
              <TweetList tweets={tweets} />
            </div>

            {/* 오른쪽 사이드 */}
            <div className="header-container w-[300px] shrink-0 hidden lg:block">
              <div className="sticky top-0 h-[100vh] overflow-hidden">
                <SidebarRight />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
