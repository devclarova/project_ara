import { useState } from 'react';
import SidebarLeft from '../../components/layout/SidebarLeft';
import SidebarRight from '../../components/layout/SidebarRight';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('posts'); // 게시글, 답장, 미디어, 좋아요 토글
  const isPostsAvailable = true; // 게시글이 있다고 가정 (임시 값)

  const tabs = [
    { id: 'posts', label: 'Posts', count: 10 },
    { id: 'replies', label: 'Replies', count: 12 },
    { id: 'media', label: 'Media', count: 8 },
    { id: 'likes', label: 'Likes', count: 45 },
  ];

  return (
    <div className="flex max-w-7xl mx-auto ">
      <SidebarLeft />
      <div className="min-h-screen">
        <div className="bg-white p-6 rounded-lg border-r max-w-4xl mx-auto">
          {/* <!-- 배경 이미지 및 프로필 사진 --> */}
          <div className="relative">
            <div className="h-48 overflow-hidden relative">
              <img
                src=""
                alt="커버이미지"
                className="w-full h-full object-cover object-top bg-slate-200"
              />
            </div>

            <div className="absolute -bottom-12 left-10">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                <img
                  src="/default-avatar.svg"
                  alt="아바타이미지"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          <div className="ml-5">
            {/* <!-- 프로필 편집 버튼 --> */}
            <div className="text-right mt-4">
              <button className="bg-primary text-white px-4 py-2 mr-5 rounded-full text-sm hover:bg-primary">
                프로필 편집
              </button>
            </div>

            {/* <!-- 프로필 정보 --> */}
            <div>
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-[#111827] mb-0.5">닉네임</h1>
                <p className="text-[#6b7280] text-sm">@아이디</p>
              </div>

              <p className="text-[#111827] mb-4 leading-relaxed">소개</p>

              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6b7280] mb-4">
                {/* 아이콘 */}
                <>
                  <link
                    href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css"
                    rel="stylesheet"
                  />
                </>
                {/* <!-- 위치--> */}
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-map-pin-line"></i>
                  </div>
                  <span>위치</span>
                </div>

                {/* <!-- 웹사이트 링크 --> */}
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-link"></i>
                  </div>
                  <a
                    href="https://example.com"
                    className="text-[#00bdaa] hover:underline cursor-pointer"
                  >
                    website
                  </a>
                </div>

                {/* <!-- 가입일--> */}
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-calendar-line"></i>
                  </div>
                  <span>Joined 202.10</span>
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

          {/* <!-- 활동 --> */}
          <div className="mt-6">
            <div className="border-t">
              {/* <!-- 탭 메뉴 --> */}
              <div className="sticky top-0 z-10">
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
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00bdaa] rounded-t-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* <!-- 탭 내용 --> */}
              <div>
                {/* 게시글 */}
                {activeTab === 'posts' && (
                  <div className="pt-4 px-10 pb-6 bg-white">
                    {/* 게시글이 있을 경우 */}
                    {/* <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="font-medium text-gray-800">
                        Just launched our new design system! 🚀
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        After 6 months of hard work, we finally have a cohesive visual language
                        across all our products. The mini color palette brings such a fresh, modern
                        feel. Check out the full post on our blog.
                      </p>
                      <div className="mt-3">
                        <img src="" alt="Tweet Image" className="w-full h-auto rounded-lg" />
                      </div>
                    </div> */}

                    {/* 게시글이 없을 경우 */}
                    <div className="bg-white p-12 text-center">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 text-[#9ca3af]">
                        <i className="ri-file-list-line text-5xl"></i>
                      </div>
                      <p className="text-[#9ca3af] text-lg">게시글이 없습니다.</p>
                    </div>
                  </div>
                )}

                {/* 답글 */}
                {activeTab === 'replies' && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="font-medium text-gray-800">Media Content goes here.</p>
                  </div>
                )}

                {activeTab === 'media' && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="font-medium text-gray-800">Highlights go here.</p>
                  </div>
                )}

                {activeTab === 'likes' && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="font-medium text-gray-800">Highlights go here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SidebarRight />
    </div>
  );
};

export default Profile;
