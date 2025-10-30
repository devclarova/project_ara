// TrendsPanel.tsx

import { useState } from "react";

export default function TrendsPanel() {
  const [searchQuery, setSearchQuery] = useState("");

  const trendingTopics = [
    { category: "Trending in Technology", topic: "OpenAI", tweets: "125K" },
    {
      category: "Trending in Sports",
      topic: "World Cup 2024",
      tweets: "89.2K",
    },
    {
      category: "Trending in Entertainment",
      topic: "Marvel Studios",
      tweets: "67.8K",
    },
    { category: "Trending", topic: "Climate Change", tweets: "45.3K" },
  ];

  const whoToFollow = [
    {
      name: "Elon Musk",
      username: "elonmusk",
      // avatar: 'https://readdy.ai/api/search-image?query=professional%20business%20portrait%20of%20tech%20entrepreneur%2C%20clean%20background%2C%20confident%20expression%2C%20modern%20lighting%2C%20high%20quality%20headshot&width=40&height=40&seq=follow-1&orientation=squarish',
      avatar: "/default-avatar.svg",
      verified: true,
    },
    {
      name: "Bill Gates",
      username: "BillGates",
      // avatar: 'https://readdy.ai/api/search-image?query=professional%20portrait%20of%20philanthropist%20businessman%2C%20clean%20background%2C%20friendly%20smile%2C%20modern%20lighting%2C%20high%20quality%20headshot&width=40&height=40&seq=follow-2&orientation=squarish',
      avatar: "/default-avatar.svg",
      verified: true,
    },
  ];

  return (
    <div className="w-80 h-full flex flex-col border-l border-gray-200 lg:px-4 py-6">
      {/* Fixed Search Bar */}
      <div className="sticky top-0 bg-white z-10 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="ri-search-line text-gray-400 text-sm"></i>
          </div>
          <input
            type="text"
            placeholder="Search Twitter"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Trending Topics */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            What's happening
          </h2>
          <div className="space-y-3">
            {trendingTopics.map((trend, index) => (
              <div
                key={index}
                className="hover:bg-gray-100 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="text-sm text-gray-500">{trend.category}</div>
                <div className="font-bold text-gray-900">{trend.topic}</div>
                <div className="text-sm text-gray-500">
                  {trend.tweets} Tweets
                </div>
              </div>
            ))}
          </div>
          <button className="text-blue-500 hover:underline mt-3 cursor-pointer whitespace-nowrap">
            Show more
          </button>
        </div>

        {/* Who to Follow */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Who to follow
          </h2>
          <div className="space-y-3">
            {whoToFollow.map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-gray-900">
                        {user.name}
                      </span>
                      {user.verified && (
                        <i className="ri-verified-badge-fill text-blue-500 text-sm"></i>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username}
                    </div>
                  </div>
                </div>
                <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap">
                  Follow
                </button>
              </div>
            ))}
          </div>
          <button className="text-blue-500 hover:underline mt-3 cursor-pointer whitespace-nowrap">
            Show more
          </button>
        </div>
      </div>
    </div>
  );
}
