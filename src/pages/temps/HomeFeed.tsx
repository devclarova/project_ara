import { useEffect, useState, useRef } from 'react';
import { Search, Image, Plus, X, Smile, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';

type Post = {
  id: number;
  content: string;
  imageUrl?: string;
  author: string;
  username: string;
  time: string;
};

type TweetComposerProps = {
  onClose?: () => void;
  onPost?: (content: string) => void;
};

function TweetComposer({ onClose, onPost }: TweetComposerProps) {
  const [content, setContent] = useState('');
  const canPost = content.trim().length > 0;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handlePost = () => {
    if (!canPost) return;
    onPost?.(content.trim());
    setContent('');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden mx-4">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-base font-semibold">새 게시물 작성</h2>
          <button
            onClick={handlePost}
            disabled={!canPost}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold text-white transition ${
              canPost ? 'bg-primary hover:bg-primary/80' : 'bg-primary/40 cursor-not-allowed'
            }`}
          >
            게시
          </button>
        </header>

        <div className="flex gap-3 p-4">
          <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="무슨 일이 일어나고 있나요?"
              className="w-full min-h-[120px] resize-y p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-gray-500">
              <div className="flex gap-4">
                <button className="p-1 hover:text-primary transition">
                  <Image className="w-5 h-5" />
                </button>
                <button className="p-1 hover:text-primary transition">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-1 hover:text-primary transition">
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
              <span className="text-xs text-gray-400">ESC로 닫기</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeFeed() {
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const allPosts: Post[] = Array.from({ length: 25 }).map((_, i) => ({
    id: i + 1,
    author: ['로아', '하루', '미나', '윤'][i % 4],
    username: ['@roa', '@haru', '@mina', '@yoon'][i % 4],
    content:
      i % 3 === 0
        ? '오늘은 따뜻한 커피와 함께 코딩을 시작했어요 ☕️'
        : '주말 여행에서 찍은 사진이에요 🌿 너무 평화로웠어요',
    imageUrl:
      i % 5 === 0
        ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80'
        : undefined,
    time: `${i + 1}시간 전`,
  }));

  const [displayedPosts, setDisplayedPosts] = useState<Post[]>(allPosts.slice(0, 6));
  const [hasMore, setHasMore] = useState(true);

  const fetchMorePosts = () => {
    setTimeout(() => {
      const next = allPosts.slice(displayedPosts.length, displayedPosts.length + 6);
      setDisplayedPosts(prev => [...prev, ...next]);
      if (displayedPosts.length + next.length >= allPosts.length) setHasMore(false);
    }, 800);
  };

  const handleAddPost = (newPost: string) => {
    const newItem: Post = {
      id: Date.now(),
      author: '나',
      username: '@me',
      content: newPost,
      time: '방금 전',
    };
    setDisplayedPosts(prev => [newItem, ...prev]);
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-900 mx-auto max-w-6xl relative">
      {/* Left Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-gray-200 bg-gray-50 p-4 gap-4 text-sm shadow-sm sticky top-0 h-screen overflow-y-auto">
        <nav className="flex flex-col gap-3 font-medium">
          <a href="#" className="text-primary font-semibold">Home</a>
          <a href="#" className="hover:text-primary">Explore</a>
          <a href="#" className="hover:text-primary">Notifications</a>
          <a href="#" className="hover:text-primary">Messages</a>
          <a href="#" className="hover:text-primary">Bookmarks</a>
          <a href="#" className="hover:text-primary">Profile</a>
        </nav>
        <button
          onClick={() => setIsComposerOpen(true)}
          className="mt-4 bg-primary text-white font-semibold py-2 rounded-full hover:bg-primary/80 transition"
        >
          Tweet
        </button>
      </aside>

      {/* Main Feed */}
      <div id="scrollableFeed" className="flex-1 border-x border-gray-200 max-w-xl bg-white overflow-y-auto h-screen">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">Home</h1>
        </header>

        <InfiniteScroll
          dataLength={displayedPosts.length}
          next={fetchMorePosts}
          hasMore={hasMore}
          loader={<p className="text-center text-gray-500 py-4">로딩 중...</p>}
          endMessage={<p className="text-center text-gray-400 py-4">모든 게시물을 불러왔습니다 🎉</p>}
          scrollableTarget="scrollableFeed"
        >
          {displayedPosts.map(post => (
            <article key={post.id} className="flex gap-3 p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{post.author}</span>
                  <span className="text-gray-500">{post.username} · {post.time}</span>
                </div>
                <p className="text-[15px] leading-relaxed whitespace-pre-line">{post.content}</p>
                {post.imageUrl && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-gray-200">
                    <img src={post.imageUrl} alt="post" className="w-full object-cover max-h-80" />
                  </div>
                )}
              </div>
            </article>
          ))}
        </InfiniteScroll>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 p-4 gap-6 bg-gray-50 border-l border-gray-200 shadow-sm sticky top-0 h-screen overflow-y-auto">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-lg mb-3">Trends for you</h2>
          <ul className="flex flex-col gap-4">
            {['#React18', '#AI', '#KoreanDrama', '#OpenAI', '#Frontend'].map((topic, i) => (
              <li key={i} className="hover:bg-gray-50 p-1 rounded-md cursor-pointer">
                <p className="text-sm font-medium">{topic}</p>
                <p className="text-xs text-gray-500">트렌드 주제</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-lg mb-3">Who to follow</h2>
          <ul className="flex flex-col gap-4">
            {['@soohaha', '@roa_dev', '@jiminyoon'].map((user, i) => (
              <li key={i} className="flex items-center justify-between hover:bg-gray-50 p-1 rounded-md cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-sm font-medium">{user}</p>
                    <p className="text-xs text-gray-500">팔로우 추천</p>
                  </div>
                </div>
                <button className="text-xs font-semibold bg-primary text-white rounded-full px-3 py-1 hover:bg-primary/80 transition">
                  Follow
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsComposerOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary hover:bg-primary/80 text-white p-4 rounded-full shadow-lg"
      >
        <Plus className="w-5 h-5" />
      </motion.button>

      {isComposerOpen && (
        <TweetComposer onClose={() => setIsComposerOpen(false)} onPost={handleAddPost} />
      )}
    </div>
  );
}
