import { useParams } from 'react-router-dom';
import { mockTweet } from '../../data/mockTweet';
import SidebarLeft from '../../components/layout/SidebarLeft';
import SidebarRight from '../../components/layout/SidebarRight';
import TweetHeader from '../../components/detail/TweetHeader';
import TweetMain from '../../components/detail/TweetMain';
import TweetStats from '../../components/detail/TweetStats';
import TweetActions from '../../components/detail/TweetActions';
import ReplyComposer from '../../components/detail/ReplyComposer';
import RepliesList from '../../components/detail/RepliesList';

const TweetDetailPage = () => {
  const { id } = useParams();

  // 현재는 mock 데이터로 표시
  const tweet = mockTweet; // 나중에 id 기준 fetch 가능

  return (
    <div className="flex max-w-7xl mx-auto">
      {/* Left Sidebar */}
      <SidebarLeft />

      {/* Center Content */}
      <div className="flex-1 min-h-screen border-r border-gray-200">
        <TweetHeader />

        {/* 본문 */}
        <TweetMain tweet={tweet} />

        {/* 통계 */}
        <TweetStats stats={tweet.stats} />

        {/* 액션 버튼 - 구조 맞춤 */}
        <TweetActions
          tweet={{
            id: tweet.id,
            likes: tweet.stats.likes,
            retweets: tweet.stats.reposts,
          }}
        />

        {/* 댓글 입력 */}
        <ReplyComposer />

        {/* 댓글 목록 - 구조 맞춤 */}
        <RepliesList
          replies={tweet.replies.map(r => ({
            id: r.id,
            author: r.author,
            handle: r.handle,
            avatar: r.avatar ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=reply',
            time: r.time,
            text: r.content, // ✅ ReplyCard의 text 필드명에 맞춤
            likes: r.likes,
            replies: r.comments, // ✅ ReplyCard는 replies 수로 표시
            retweets: r.retweets,
          }))}
        />
      </div>

      {/* Right Sidebar */}
      <SidebarRight />
    </div>
  );
};

export default TweetDetailPage;
