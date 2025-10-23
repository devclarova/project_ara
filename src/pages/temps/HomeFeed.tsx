// src/pages/HomeFeed.tsx
import { useEffect, useState } from 'react';
import TweetComposer from '../../components/feed/TweetComposer';
import TweetList from '../../components/feed/TweetList';
import Header from '../../components/layout/Header';
import SidebarLeft from '../../components/layout/SidebarLeft';
import SidebarRight from '../../components/layout/SidebarRight';
import { supabase } from '../../lib/supabase';

const HomeFeed = () => {
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

  // ✅ 게시글 작성 시 즉시 UI 반영 + Supabase INSERT
  const handleAddTweet = async (content: string, image_url?: string | null) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 1️⃣ Supabase INSERT
    const { data, error } = await supabase
      .from('tweets')
      .insert([
        {
          content,
          image_url,
          author_id: user.id,
          like_count: 0,
          repost_count: 0,
          bookmark_count: 0,
        },
      ])
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
      .single();

    if (error) {
      console.error('❌ Error inserting tweet:', error);
      return;
    }

    console.log('✅ New tweet added:', data);

    // 2️⃣ UI 즉시 업데이트
    setTweets(prev => [data, ...prev]);
  };

  return (
    <div className="flex max-w-7xl mx-auto">
      <SidebarLeft onPost={handleAddTweet} />
      <main className="flex-1 min-h-screen border-r border-gray-200">
        <Header title="Home" />
        <TweetComposer onPost={handleAddTweet} />
        <TweetList tweets={tweets} />
      </main>
      <SidebarRight />
    </div>
  );
};

export default HomeFeed;
