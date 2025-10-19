// src/pages/ProfilePage.tsx
import SidebarLeft from '../../components/layout/SidebarLeft';
import SidebarRight from '../../components/layout/SidebarRight';

const ProfilePage = () => {
  return (
    <div className="flex max-w-7xl mx-auto bg-white">
      <SidebarLeft />
      <main className="flex-1 min-h-screen border-r border-gray-200">
        <h2 className="text-xl font-semibold px-4 py-3 border-b">Profile</h2>
        <div className="p-6 text-gray-600">프로필 정보와 트윗 기록을 확인하세요 👤</div>
      </main>
      <SidebarRight />
    </div>
  );
};

export default ProfilePage;
