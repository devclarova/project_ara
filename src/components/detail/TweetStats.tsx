interface TweetStatsProps {
  stats: {
    reposts: number;
    quotes: number;
    likes: number;
    bookmarks: number;
  };
}
const TweetStats = ({ stats }: TweetStatsProps) => {
  const { reposts, quotes, likes, bookmarks } = stats;
  return (
    <section className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center space-x-8 text-sm">
        <div className="flex items-center space-x-1">
          <span className="font-bold text-black">{reposts}</span>
          <span className="text-secondary">Reposts</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="font-bold text-black">{quotes}</span>
          <span className="text-secondary">Quote posts</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="font-bold text-black">{likes}</span>
          <span className="text-secondary">Likes</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="font-bold text-black">{bookmarks}</span>
          <span className="text-secondary">Bookmarks</span>
        </div>
      </div>
    </section>
  );
};

export default TweetStats;
