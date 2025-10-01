// PostListDetail.tsx

import { PostCardDetail } from "./TempPostCardDetail";

type Post = {
  id: number;
  path: string;
  title: string;
  content: string;
  author: string;
  time: string;
  avatar?: string;
  stats: {
    answers: number;
    likes: number;
    comments: number;
  };
};

type PostListDetailProps = {
  posts: Post[];
};

export function PostListDetail({ posts }: PostListDetailProps) {
  return (
    <div className="post-list flex flex-col gap-4">
      {posts.map(post => (
        <PostCardDetail key={post.id} {...post} />
      ))}
    </div>
  );
}
