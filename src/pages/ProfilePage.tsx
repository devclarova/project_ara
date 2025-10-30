import ProfileActivity from '@/components/profile/ProfileActivity';
import ProfileEdit from '@/components/profile/ProfileEdit';
import ProfileInfo, { type ProfileData } from '@/components/profile/ProfileInfo';
import type { TabItem } from '@/components/profile/ProfileTabBar';
import ProfileTabBar from '@/components/profile/ProfileTabBar';
import type { ActivityTab } from '@/types/profile';
import { useState } from 'react';
import Sidebar from './homes/feature/Sidebar';
import TrendsPanel from './homes/feature/TrendsPanel';
import TweetModal from './homes/feature/TweetModal';

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
  const [profile, setProfile] = useState<ProfileData>({
    nickname: '닉네임',
    handle: '아이디',
    bio: '소개',
    location: '위치',
    joined: '2025.10',
    birth: '2001-01-01',
    followingCount: 444,
    followerCount: 1180,
    cover_url: null,
    avatar_url: '/default-avatar.svg',
  });

  const [activeTab, setActiveTab] = useState<ActivityTab>('posts'); // 게시글, 답장, 미디어, 좋아요 토글
  const [likedPosts, setLikedPosts] = useState<string[]>([]); // 좋아요한 글 ID 저장
  // const coverUrl: string | null = null;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showTweetModal, setShowTweetModal] = useState(false);

  const toggleLike = (postId: string) => {
    setLikedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId],
    );
  };

  const tabs: TabItem<ActivityTab>[] = [
    { id: 'posts', label: 'Posts', count: mockPosts.length },
    { id: 'replies', label: 'Replies', count: 12 },
    { id: 'media', label: 'Media', count: mockPosts.filter(p => p.image).length },
    { id: 'likes', label: 'Likes', count: likedPosts.length },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Centered Container for all three sections */}
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar - Now part of centered layout */}
          <div className="w-20 lg:w-64 flex-shrink-0">
            <div className="fixed w-20 lg:w-64 h-full z-10">
              <Sidebar onTweetClick={() => setShowTweetModal(true)} />
            </div>
          </div>

          {/* Central Content with spacing */}
          <main className="flex-1 min-w-0 px-6 py-8 pb-20 lg:pb-6">
            <div className="w-full mx-auto bg-white sm:max-w-none md:max-w-2xl lg:w-[680px] xl:w-[720px] shrink-0">
              {/* ===== 프로필 정보 ===== */}
              <ProfileInfo profile={profile} onClickEdit={() => setIsEditOpen(true)} />

              {/* 프로필 편집 모달 */}
              <ProfileEdit
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                initial={{
                  name: profile.nickname,
                  bio: profile.bio ?? '',
                  birth: '',
                  gender: '남',
                  country: profile.location ?? '대한민국',
                  avatarUrl: profile.avatar_url ?? '',
                }}
                onSave={data => {
                  setProfile(prev => ({
                    ...prev,
                    nickname: data.name || prev.nickname,
                    bio: data.bio ?? prev.bio,
                    birth: data.birth || prev.birth,
                    location: data.country || prev.location,
                    avatarUrl: data.avatarUrl || prev.avatar_url,
                  }));
                  setIsEditOpen(false);
                }}
              />

              {/* ===== 활동 탭 ===== */}
              <ProfileTabBar<ActivityTab>
                activeId={activeTab}
                tabs={tabs}
                onChange={id => setActiveTab(id)}
              />

              <ProfileActivity
                activeTab={activeTab}
                tabs={tabs}
                posts={mockPosts}
                likedPosts={likedPosts}
                onToggleLike={toggleLike}
              />
            </div>
          </main>

          {/* Right Trends Panel - Now part of centered layout */}
          <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-0 h-screen">
              <div className="py-4 h-full">
                <TrendsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tweet Modal */}
      {showTweetModal && <TweetModal onClose={() => setShowTweetModal(false)} />}
    </div>
  );
};

export default ProfilePage;
