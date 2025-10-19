import TweetCard from './TweetCard';

const tweets = [
  {
    id: '1',
    author: 'Sarah Chen',
    handle: 'sarahchen_dev',
    avatar: 'https://picsum.photos/seed/avatar1/80  ',
    time: '2h',
    content: 'Just shipped a new feature that reduces our app load time by 40%! 🚀 #WebDev',
    image: 'https://picsum.photos/500/280',
    comments: 24,
    retweets: 87,
    likes: 342,
  },
  {
    id: '2',
    author: 'Marcus Rivera',
    handle: 'marcusdesigns',
    avatar: 'https://picsum.photos/seed/avatar2/80',
    time: '4h',
    content:
      "The future of design is not just about looks — it's about experiences that solve real problems.",
    comments: 156,
    retweets: 423,
    likes: 1200,
  },
];

const TweetList = () => {
  return (
    <div className="divide-y divide-gray-200">
      {tweets.map(tweet => (
        <TweetCard key={tweet.id} {...tweet} />
      ))}
    </div>
  );
};

export default TweetList;
