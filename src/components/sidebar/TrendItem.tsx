interface TrendItemProps {
  category: string;
  tag: string;
  posts: string;
}

const TrendItem = ({ category, tag, posts }: TrendItemProps) => {
  return (
    <div className="trend-item p-2 rounded cursor-pointer transition-colors hover:bg-gray-100">
      <p className="text-secondary text-sm">{category}</p>
      <p className="font-bold">{tag}</p>
      <p className="text-secondary text-sm">{posts} posts</p>
    </div>
  );
};

export default TrendItem;
