// src/pages/TweetDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SidebarLeft from '../../components/layout/SidebarLeft';
import SidebarRight from '../../components/layout/SidebarRight';
import TweetHeader from '../../components/detail/TweetHeader';
import TweetMain from '../../components/detail/TweetMain';
import TweetStats from '../../components/detail/TweetStats';
import TweetActions from '../../components/detail/TweetActions';
import ReplyComposer from '../../components/detail/ReplyComposer';
import RepliesList from '../../components/detail/RepliesList';
import { supabase } from '../../lib/supabase';

interface Tweet {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  repost_count: number;
  bookmark_count: number;
  profiles: { nickname: string; avatar_url: string } | null;
}

interface UiReply {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  replies: number;
  retweets: number;
}

export default function TweetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<UiReply[]>([]);

  // 트윗 단건 불러오기
  useEffect(() => {
    const fetchTweet = async () => {
      if (!id) return;
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
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching tweet:', error);
      } else {
        setTweet(data);
      }

      setLoading(false);
    };

    fetchTweet();
  }, [id]);

  // 댓글 작성 핸들러
  const handleAddReply = async (parentId: string, content: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const { data, error } = await supabase
      .from('tweet_replies')
      .insert([{ tweet_id: parentId, author_id: user.id, content }])
      .select(
        `
      id,
      content,
      created_at,
      profiles:author_id (
        nickname,
        avatar_url
      )
    `,
      )
      .single();

    if (error) {
      console.error('❌ 댓글 등록 실패:', error);
      return;
    }

    // UI 즉시 업데이트
    setReplies(prev => [
      {
        id: data.id,
        author: data.profiles?.nickname || 'You',
        handle: data.profiles?.nickname || '',
        avatar: data.profiles?.avatar_url || '',
        time: '방금 전',
        text: data.content,
        likes: 0,
        replies: 0,
        retweets: 0,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    const fetchReplies = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('tweet_replies')
        .select(
          `
        id,
        content,
        created_at,
        profiles:author_id (
          nickname,
          avatar_url
        )
      `,
        )
        .eq('tweet_id', id)
        .order('created_at', { ascending: false });

      if (error) console.error('❌ 댓글 불러오기 실패:', error);
      else
        setReplies(
          data.map(r => ({
            id: r.id,
            author: r.profiles?.nickname || 'Unknown',
            handle: r.profiles?.nickname || '',
            avatar: r.profiles?.avatar_url || '',
            time: new Date(r.created_at).toLocaleString('ko-KR'),
            text: r.content,
            likes: 0,
            replies: 0,
            retweets: 0,
          })),
        );
    };

    fetchReplies();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">로딩 중...</div>
    );
  }

  if (!tweet) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        트윗을 찾을 수 없습니다 😢
      </div>
    );
  }

  return (
    <div className="flex max-w-7xl mx-auto bg-white">
      {/* Reply 모드로 SidebarLeft 연결 */}
      <SidebarLeft isReplyMode parentId={tweet.id} onReply={handleAddReply} />

      <main className="flex-1 min-h-screen border-r border-gray-200">
        <TweetHeader />
        <TweetMain
          tweet={{
            id: tweet.id,
            author: tweet.profiles?.nickname || 'Unknown User',
            avatar: tweet.profiles?.avatar_url || '',
            content: tweet.content,
            image: tweet.image_url,
            created_at: tweet.created_at,
          }}
        />
        <TweetStats
          stats={{
            likes: tweet.like_count,
            reposts: tweet.repost_count,
            bookmarks: tweet.bookmark_count,
          }}
          createdAt={tweet.created_at}
        />
        <TweetActions
          tweet={{ id: tweet.id, likes: tweet.like_count, retweets: tweet.repost_count }}
        />

        <ReplyComposer parentId={tweet.id} onReply={handleAddReply} />
        <RepliesList replies={replies} />
      </main>

      <SidebarRight />
    </div>
  );
}
