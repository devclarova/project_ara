import SidebarLeft from '@/components/layout/SidebarLeft';
import SidebarRight from '@/components/layout/SidebarRight';
import ProfileActivity from '@/components/profile/ProfileActivity';
import ProfileEdit from '@/components/profile/ProfileEdit';
import ProfileInfo from '@/components/profile/ProfileInfo';
import type { TabItem } from '@/components/profile/ProfileTabBar';
import ProfileTabBar from '@/components/profile/ProfileTabBar';
import { useProfile } from '@/hooks/useProfile';
import type { ActivityTab, ProfileData } from '@/types/profile';
import { useState } from 'react';

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
  const { profile, loading, isEditOpen, openEdit, closeEdit, save } = useProfile();
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts'); // 게시글, 답장, 미디어, 좋아요 토글
  const [likedPosts, setLikedPosts] = useState<string[]>([]); // 좋아요한 글 ID 저장
  // const [isEditOpen, setIsEditOpen] = useState(false);

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
    <div className="min-h-screen flex items-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6">
      {/* 왼쪽 사이드바 */}
      <SidebarLeft />
      {/* 가운데 메인 영역 */}
      <main className="flex-1 min-w-0 px-0 sm:px-2 md:px-4 py-8 pb-20 lg:pb-6">
        <div className="w-full mx-auto bg-white sm:max-w-none md:max-w-2xl lg:w-[680px] xl:w-[720px] shrink-0">
          {/* ===== 프로필 정보 ===== */}
          <ProfileInfo profile={profile} onClickEdit={openEdit} />

          {/* 프로필 편집 모달 */}
          <ProfileEdit
            open={isEditOpen}
            onClose={closeEdit}
            initial={{
              name: profile.nickname,
              bio: profile.bio ?? '',
              birth: profile.birth ?? '',
              gender: '남',
              country: profile.location ?? '대한민국',
              avatarUrl: profile.avatarUrl ?? '',
              coverUrl: profile.coverUrl ?? '',
            }}
            onSave={async data => {
              const ok = await save(data);
              closeEdit();
              if (!ok) {
                // 실패 시 로컬로라도 반영하고 싶다면 아래 주석 해제
                // setProfile(prev => ({ ...prev, ...data }));
              }
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
      {/* 오른쪽 사이드바 */}
      <aside className="hidden lg:block w-[300px] shrink-0">
        <SidebarRight />
      </aside>
    </div>
  );
};

export default ProfilePage;
