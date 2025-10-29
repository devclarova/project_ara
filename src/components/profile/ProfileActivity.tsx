// 프로필 활동 (게시물, 답장, 미디어, 좋아요)

import PostCard, { EmptyCard } from '@/components/profile/PostCard';
import type { TabItem } from '@/components/profile/ProfileTabBar';
import type { ActivityTab } from '@/types/profile';

type Post = {
  id: string;
  author: { name: string; username: string; avatar: string };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
};

type ProfileActivityProps = {
  activeTab: ActivityTab;
  tabs: TabItem<ActivityTab>[];
  posts: Post[];
  likedPosts: string[];
  onToggleLike: (postId: string) => void;
};

function ProfileActivity({ activeTab, posts, likedPosts, onToggleLike }: ProfileActivityProps) {
  return (
    <div className="pt-4 px-10 pb-6 bg-white">
      <div className="space-y-6 min-h-[240px]">
        {/* Posts */}
        {activeTab === 'posts' && (
          <>
            {posts.length > 0 ? (
              posts.map(post => (
                <div
                  key={post.id}
                  className="transition-all duration-150 hover:bg-[#f9fafb] rounded-2xl"
                >
                  <PostCard
                    {...post}
                    isLiked={likedPosts.includes(post.id)}
                    onLike={() => onToggleLike(post.id)}
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
            {posts.filter(p => p.image).length > 0 ? (
              posts
                .filter(post => post.image)
                .map(post => (
                  <div
                    key={post.id}
                    className="transition-all duration-150 hover:bg-[#f9fafb] rounded-2xl"
                  >
                    <PostCard
                      {...post}
                      isLiked={likedPosts.includes(post.id)}
                      onLike={() => onToggleLike(post.id)}
                    />
                  </div>
                ))
            ) : (
              <EmptyCard iconClass="ri-image-line" text="미디어가 없습니다." />
            )}
          </>
        )}

        {/* Likes — 내가 누른 글만 */}
        {activeTab === 'likes' && (
          <>
            {likedPosts.length > 0 ? (
              posts
                .filter(post => likedPosts.includes(post.id))
                .map(post => (
                  <div
                    key={post.id}
                    className="transition-all duration-150 hover:bg-[#f9fafb] rounded-2xl"
                  >
                    <PostCard
                      {...post}
                      isLiked
                      onLike={() => onToggleLike(post.id)} // 다시 누르면 좋아요 해제
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
  );
}

export default ProfileActivity;
