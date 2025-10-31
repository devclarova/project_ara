import TweetCard from "../../feature/TweetCard";
import { mockTweets } from "../../mocks/tweets";


interface ProfileTweetsProps {
  activeTab: string;
  userProfile: {
    name: string;
    username: string;
    avatar: string;
  };
}

export default function ProfileTweets({ activeTab, userProfile }: ProfileTweetsProps) {
  // Filter tweets for the current profile user
  const userTweets = mockTweets.filter(tweet => tweet.user.username === userProfile.username);
  
  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return userTweets.length > 0 ? (
          <div>
            {userTweets.map((tweet) => (
              <TweetCard
                key={tweet.id}
                id={tweet.id}
                user={tweet.user}
                content={tweet.content}
                image={tweet.image}
                timestamp={tweet.timestamp}
                stats={tweet.stats}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-sm mx-auto">
              <i className="ri-file-text-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-6">
                When {userProfile.name} posts something, it will show up here.
              </p>
            </div>
          </div>
        );
        
      case 'replies':
        return (
          <div className="text-center py-16">
            <div className="max-w-sm mx-auto">
              <i className="ri-chat-3-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No replies yet</h3>
              <p className="text-gray-500">
                When {userProfile.name} replies to someone, it will show up here.
              </p>
            </div>
          </div>
        );
        
      case 'highlights':
        return (
          <div className="text-center py-16">
            <div className="max-w-sm mx-auto">
              <i className="ri-star-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No highlights yet</h3>
              <p className="text-gray-500">
                {userProfile.name} hasn't highlighted any posts yet.
              </p>
            </div>
          </div>
        );
        
      case 'media':
        return (
          <div className="text-center py-16">
            <div className="max-w-sm mx-auto">
              <i className="ri-image-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No media yet</h3>
              <p className="text-gray-500">
                Posts with photos and videos from {userProfile.name} will show up here.
              </p>
            </div>
          </div>
        );
        
      case 'likes':
        return (
          <div className="text-center py-16">
            <div className="max-w-sm mx-auto">
              <i className="ri-heart-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No likes yet</h3>
              <p className="text-gray-500">
                Posts that {userProfile.name} has liked will show up here.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {renderContent()}
    </div>
  );
}
