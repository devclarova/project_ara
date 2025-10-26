import { useState } from 'react';

const mockPosts = [
  {
    id: '1',
    author: {
      name: 'Lorem Dolor',
      username: 'alexthompson',
      avatar: 'default-avatar.svg',
    },
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer pretium lectus non est accumsan, sed dapibus ligula tempus.',
    image: 'https://placehold.co/40x40',
    timestamp: '2 hours ago',
    likes: 1247,
    comments: 89,
    shares: 156,
  },
  {
    id: '2',
    author: {
      name: 'Ipsum Vitae',
      username: 'jessicapark',
      avatar: 'default-avatar.svg',
    },
    content:
      'Ut sed orci et neque pretium condimentum. Cras vulputate nunc sed est tempus, nec blandit felis tincidunt.',
    image: 'https://placehold.co/40x40',
    timestamp: '4 hours ago',
    likes: 892,
    comments: 45,
    shares: 23,
  },
  {
    id: '3',
    author: {
      name: 'Dolor Elit',
      username: 'michaelchen',
      avatar: 'default-avatar.svg',
    },
    content:
      'Praesent sodales metus ac dui porttitor, nec tristique nulla euismod. Vivamus pharetra vel erat non tincidunt.',
    image: 'https://placehold.co/40x40',
    timestamp: '6 hours ago',
    likes: 2156,
    comments: 234,
    shares: 445,
  },
  {
    id: '4',
    author: {
      name: 'Amet Cras',
      username: 'sophiemartinez',
      avatar: 'default-avatar.svg',
    },
    content:
      'Suspendisse potenti. Curabitur eget erat a sapien interdum faucibus. Proin sed sapien at nunc cursus dictum.',
    timestamp: '8 hours ago',
    likes: 654,
    comments: 67,
    shares: 89,
  },

  {
    id: '6',
    author: {
      name: 'Consectetur Nunc',
      username: 'emmawilson',
      avatar: 'default-avatar.svg',
    },
    content:
      'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae. Pellentesque ut elit et augue vehicula iaculis.',
    timestamp: '1 day ago',
    likes: 987,
    comments: 92,
    shares: 134,
  },
];

interface PostCardProps {
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

export function PostCard({
  author,
  content,
  image,
  timestamp,
  likes,
  comments,
  shares,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <article className="bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-150">
      <div className="flex items-start gap-3 mb-3">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-12 h-12 rounded-full object-cover object-top"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#111827]">{author.name}</h3>
              <p className="text-sm text-[#6b7280]">@{author.username}</p>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e2f8f5] transition-all duration-200 cursor-pointer">
              <i className="ri-more-2-fill text-[#6b7280]"></i>
            </button>
          </div>
        </div>
      </div>

      <p className="text-[#111827] mb-3 leading-relaxed">{content}</p>

      {image && (
        <div className="mb-3 rounded-xl overflow-hidden">
          <img src={image} alt="Post content" className="w-full h-auto object-cover object-top" />
        </div>
      )}

      <div className="flex items-center justify-between text-[#6b7280] text-sm mb-3">
        <span>{timestamp}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb]">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e2f8f5] transition-all duration-200 cursor-pointer ${
            isLiked ? 'text-[#ef4444]' : 'text-[#6b7280]'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className={`${isLiked ? 'ri-heart-fill' : 'ri-heart-line'} text-xl`}></i>
          </div>
          <span className="font-medium">{likeCount}</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e2f8f5] text-[#6b7280] transition-all duration-200 cursor-pointer">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-chat-3-line text-xl"></i>
          </div>
          <span className="font-medium">{comments}</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e2f8f5] text-[#6b7280] transition-all duration-200 cursor-pointer">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-share-line text-xl"></i>
          </div>
          <span className="font-medium">{shares}</span>
        </button>

        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e2f8f5] transition-all duration-200 cursor-pointer ${
            isBookmarked ? 'text-[#00bdaa]' : 'text-[#6b7280]'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className={`${isBookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line'} text-xl`}></i>
          </div>
        </button>
      </div>
    </article>
  );
}

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState('posts');

  const profileData = {
    name: 'Lorem Ipsum',
    username: 'lorem_ipsum',
    bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus at libero nec nulla facilisis gravida.',
    location: 'Dolor City, Ipsumland',
    website: 'loremipsum.dev',
    joinedDate: 'March 2024',
    following: 234,
    followers: 1847,
    coverImage: 'https://placehold.co/100',
    avatar: 'default-avatar.svg',
  };

  const userPosts = mockPosts.filter((_, index) => index < 3);

  const tabs = [
    { id: 'posts', label: 'Posts', count: userPosts.length },
    { id: 'replies', label: 'Replies', count: 12 },
    { id: 'media', label: 'Media', count: 8 },
    { id: 'likes', label: 'Likes', count: 45 },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="flex max-w-[1920px] mx-auto">
        <main className="flex-1 min-w-0 pb-20 lg:pb-6">
          <div className="max-w-2xl mx-auto bg-white">
            {/* Cover Image */}
            <div className="relative">
              <div className="h-48 bg-gradient-to-br from-[#00bdaa] to-[#14c7bb] overflow-hidden relative">
                <img
                  src={profileData.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"></div>
              </div>

              <div className="absolute -bottom-12 left-10">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                  <img
                    src={profileData.avatar}
                    alt={profileData.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              <div className="absolute top-3 right-6">
                <button className="px-6 py-2 bg-[#00bdaa] text-white font-medium rounded-full hover:bg-[#14c7bb] transition-all duration-200 cursor-pointer whitespace-nowrap shadow-sm">
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="px-10 pt-14 pb-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-[#111827] mb-0.5">{profileData.name}</h1>
                <p className="text-[#6b7280] text-sm">@{profileData.username}</p>
              </div>

              <p className="text-[#111827] mb-4 leading-relaxed">{profileData.bio}</p>

              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6b7280] mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-map-pin-line"></i>
                  </div>
                  <span>{profileData.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-link"></i>
                  </div>
                  <a
                    href={`https://${profileData.website}`}
                    className="text-[#00bdaa] hover:underline cursor-pointer"
                  >
                    {profileData.website}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-calendar-line"></i>
                  </div>
                  <span>Joined {profileData.joinedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm pt-4 border-t border-[#e5e7eb]">
                <button className="hover:underline cursor-pointer transition-all duration-200">
                  <span className="font-bold text-[#111827]">{profileData.following}</span>
                  <span className="text-[#6b7280] ml-1">Following</span>
                </button>
                <button className="hover:underline cursor-pointer transition-all duration-200">
                  <span className="font-bold text-[#111827]">{profileData.followers}</span>
                  <span className="text-[#6b7280] ml-1">Followers</span>
                </button>
              </div>
            </div>

            <div className="bg-[#e2f8f5] border-b border-[#e5e7eb] sticky top-0 z-10 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="flex">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 h-12 px-5 font-medium text-sm transition-all duration-200 cursor-pointer relative ${
                      activeTab === tab.id
                        ? 'text-[#00bdaa] font-semibold'
                        : 'text-[#6b7280] hover:text-[#00bdaa] hover:bg-white/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00bdaa] rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Feed - Improved Spacing */}
            <div className="bg-[#f9fafb]">
              {activeTab === 'posts' && (
                <div className="pt-4 px-10 pb-6 bg-white">
                  {userPosts.length > 0 ? (
                    <div className="space-y-6">
                      {userPosts.map(post => (
                        <div
                          key={post.id}
                          className="transition-all duration-150 hover:bg-[#f9fafb] rounded-2xl"
                        >
                          <PostCard {...post} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 text-[#9ca3af]">
                        <i className="ri-file-list-line text-5xl"></i>
                      </div>
                      <p className="text-[#9ca3af] text-lg">No posts yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'replies' && (
                <div className="pt-4 px-10 pb-6 bg-white">
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                    <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 text-[#9ca3af]">
                      <i className="ri-chat-3-line text-5xl"></i>
                    </div>
                    <p className="text-[#9ca3af] text-lg">No replies yet.</p>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="pt-4 px-10 pb-6 bg-white">
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(item => (
                      <div
                        key={item}
                        className="aspect-square rounded-xl overflow-hidden bg-white border border-[#e5e7eb] cursor-pointer hover:opacity-90 transition-all duration-150 shadow-sm"
                      >
                        <img
                          src={`https://placehold.co/600x400`}
                          alt={`Media ${item}`}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'likes' && (
                <div className="pt-4 px-10 pb-6 bg-white">
                  <div className="space-y-6">
                    {mockPosts.slice(0, 2).map(post => (
                      <div
                        key={post.id}
                        className="transition-all duration-150 hover:bg-[#f9fafb] rounded-2xl"
                      >
                        <PostCard {...post} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
