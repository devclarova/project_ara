import SidebarLeft from '@/components/layout/SidebarLeft';
import { useState } from 'react';
import PostCard, { EmptyCard } from '@/components/profile/PostCard';
import SidebarRight from '@/components/layout/SidebarRight';
import ProfileEdit from '@/components/profile/ProfileEdit';

const mockPosts = [
  {
    id: '1',
    author: {
      name: '이서준',
      username: 'seojunlee',
      avatar: 'default-avatar.svg',
    },
    content:
      '오늘은 오랜만에 한강에 다녀왔어요. 날씨가 정말 좋아서 걷기 딱 좋았네요 ☀️ 다음에는 돗자리 펴고 도시락 먹고 싶어요.',
    timestamp: '2시간 전',
    likes: 1247,
    comments: 89,
    shares: 156,
  },
  {
    id: '2',
    author: {
      name: '박지윤',
      username: 'ji_yoon',
      avatar: 'default-avatar.svg',
    },
    content:
      '요즘 커피 대신 차를 마시는데, 확실히 속이 편해진 것 같아요 🍵 혹시 추천할 만한 티 브랜드 있나요?',
    timestamp: '4시간 전',
    likes: 892,
    comments: 45,
    shares: 23,
  },
  {
    id: '3',
    author: {
      name: '김민수',
      username: 'minsu_kim',
      avatar: 'default-avatar.svg',
    },
    content:
      '새 프로젝트 준비 중입니다! 이번엔 조금 다른 접근으로 시도해볼 예정이라 설레네요. 좋은 결과로 돌아올게요 💪',
    image: 'https://placehold.co/40x40',
    timestamp: '6시간 전',
    likes: 2156,
    comments: 234,
    shares: 445,
  },
  {
    id: '4',
    author: {
      name: '최수연',
      username: 'sooyeon_c',
      avatar: 'default-avatar.svg',
    },
    content:
      '요즘 비가 자주 와서 그런가, 창문 열고 빗소리 들으면서 책 읽는 게 하루 중 제일 힐링이에요 ☔📖',
    timestamp: '8시간 전',
    likes: 654,
    comments: 67,
    shares: 89,
  },
];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('posts'); // 게시글, 답장, 미디어, 좋아요 토글
  const [likedPosts, setLikedPosts] = useState<string[]>([]); // ❤️ 좋아요한 글 ID 저장
  const coverUrl: string | null = null;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const toggleLike = (postId: string) => {
    setLikedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId],
    );
  };

  const tabs = [
    { id: 'posts', label: 'Posts', count: mockPosts.length },
    { id: 'replies', label: 'Replies', count: 12 },
    { id: 'media', label: 'Media', count: 8 },
    { id: 'likes', label: 'Likes', count: 45 },
  ];

  return (
    <div className="min-h-screen flex max-w-7xl mx-auto">
      <SidebarLeft />

      <main className="pb-20 lg:pb-6 px-6 py-8">
        <div className="w-full max-w-2xl mx-auto bg-white mr-2">
          {/* ===== 커버 + 아바타 영역 ===== */}
          <div className="relative">
            <div className="h-48 overflow-hidden relative">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="커버이미지"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-slate-200" />
              )}
            </div>

            <div className="absolute -bottom-12 ml-5 mb-3">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden">
                <img
                  src="/default-avatar.svg"
                  alt="아바타이미지"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* ===== 프로필 정보 ===== */}
          <div className="ml-5">
            <div className="text-right mt-4">
              <button
                className="bg-primary/80 text-white px-4 py-2 mr-5 rounded-full text-sm hover:bg-primary"
                onClick={() => setIsEditOpen(true)}
              >
                프로필 편집
              </button>
            </div>

            <div>
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-[#111827] mb-0.5">닉네임</h1>
                <p className="text-[#6b7280] text-sm">@아이디</p>
              </div>

              <p className="text-[#111827] mb-4 leading-relaxed">소개</p>

              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6b7280] mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-map-pin-line" />
                  </div>
                  <span>위치</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-link" />
                  </div>
                  <a
                    href="https://example.com"
                    className="text-[#00bdaa] hover:underline cursor-pointer"
                  >
                    website
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-calendar-line" />
                  </div>
                  <span>Joined 2025.10</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <button className="hover:underline cursor-pointer transition-all duration-200">
                  <span className="font-bold text-[#111827]">444</span>
                  <span className="text-[#6b7280] ml-1">Following</span>
                </button>
                <button className="hover:underline cursor-pointer transition-all duration-200">
                  <span className="font-bold text-[#111827]">1,180</span>
                  <span className="text-[#6b7280] ml-1">Followers</span>
                </button>
              </div>
            </div>
          </div>

          {/* ===== 활동 탭 ===== */}
          <div className="mt-6">
            <div className="border-t">
              {/* 탭 바 */}
              <div className="sticky top-0 z-10 bg-white border-b">
                <div className="flex">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 h-12 px-5 font-medium text-sm transition-all duration-200 cursor-pointer relative ${
                        activeTab === tab.id
                          ? 'text-[#00bdaa] font-semibold'
                          : 'text-[#6b7280] hover:text-[#00bdaa]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00bdaa] rounded-t-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 px-10 pb-6 bg-white">
                <div className="space-y-6 min-h-[240px]">
                  {/* Posts */}
                  {activeTab === 'posts' && (
                    <>
                      {mockPosts.length > 0 ? (
                        mockPosts.map(post => (
                          <div
                            key={post.id}
                            className="transition-all duration-150 hover:bg-[#f9fafb] rounded-2xl"
                          >
                            <PostCard
                              {...post}
                              isLiked={likedPosts.includes(post.id)}
                              onLike={() => toggleLike(post.id)}
                            />
                          </div>
                        ))
                      ) : (
                        <EmptyCard iconClass="ri-file-list-line" text="게시글이 없습니다." />
                      )}
                    </>
                  )}

                  {/* Replies */}
                  {activeTab === 'replies' && (
                    <EmptyCard iconClass="ri-chat-3-line" text="답글이 없습니다." />
                  )}

                  {/* Media */}
                  {activeTab === 'media' && (
                    <>
                      {mockPosts.length > 0 ? (
                        mockPosts
                          .filter(post => post.image)
                          .map(post => (
                            <div
                              key={post.id}
                              className="transition-all duration-150 hover:bg-[#f9fafb] rounded-2xl"
                            >
                              <PostCard {...post} />
                            </div>
                          ))
                      ) : (
                        <EmptyCard iconClass="ri-image-line" text="미디어가 없습니다." />
                      )}
                    </>
                  )}

                  {/* Likes */}
                  {activeTab === 'likes' && (
                    <>
                      {mockPosts.length > 0 ? (
                        mockPosts
                          .filter(post => post.likes)
                          .map(post => (
                            <div
                              key={post.id}
                              className="transition-all duration-150 hover:bg-[#f9fafb] rounded-2xl"
                            >
                              <PostCard
                                {...post}
                                isLiked={!likedPosts.includes(post.id)}
                                onLike={() => toggleLike(post.id)}
                              />
                            </div>
                          ))
                      ) : (
                        <EmptyCard text="좋아요한 게시글이 없습니다." />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SidebarRight />

      {/* === 모달 마운트 === */}
      <ProfileEdit
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={data => {
          // TODO: 여기에 Supabase/API 연동
          console.log('저장 데이터:', data);
          setIsEditOpen(false);
        }}
      />
    </div>
  );
};

export default ProfilePage;
