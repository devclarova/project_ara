// src/pages/feed/FeedMain.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import TweetList from '@/components/feed/TweetList';
import FFFBox from './FFFBox';

export default function FeedMain() {
  const [tweets, setTweets] = useState<any[]>([]);
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  useEffect(() => {
    const fetchTweets = async () => {
      const { data, error } = await supabase
        .from('tweets')
        .select(
          `
          id, content, image_url, created_at,
          like_count, repost_count, bookmark_count,
          profiles:author_id (nickname, avatar_url)
        `,
        )
        .order('created_at', { ascending: false });
      if (!error) setTweets(data);
    };
    fetchTweets();
  }, []);

  const handleAddTweet = (newTweet: any) => {
    setTweets(prev => [newTweet, ...prev]);
  };

  return (
    <div className="space-y-4">
      <FFFBox profile={profile} onPost={handleAddTweet} />

      <div className="rounded-2xl  overflow-hidden">
        <TweetList tweets={tweets} />
      </div>
    </div>
  );
}
