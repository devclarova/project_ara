import { supabase } from '../lib/supabase';
import type { Post, PostInsert, PostUpdate } from '../types/database';

// 게시판 목록 조회
export const getPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(`getPosts 오류: ${error.message}`);
  }
  return data || [];
};

// 게시판 목록 조회(id)를 이용
export const getPostById = async (id: number): Promise<Post | null> => {
  try {
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
    if (error) {
      throw new Error(`getPostById 오류: ${error.message}`);
    }
    return data;
  } catch (err) {
    console.log(`getPostById 에러: `, err);
    return null;
  }
};

// 게시글 생성
export const createPost = async (newPost: Omit<PostInsert, 'user_id'>): Promise<Post | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload /* : TablesInsert<'posts'> */ = {
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      category: newPost.category /* as Enums['category_type'] */,
      user_id: user!.id,
      // comments는 nullable이지만 0으로 시작하고 싶으면 아래처럼:
      // comments: newPost.comments ?? 0,
      // updated_at만 직접 찍고 싶으면(선택):
      updated_at: new Date().toISOString(),
    };

    // if (!user) {
    //   throw new Error('로그인이 필요합니다.');
    // }
    const { data, error } = await supabase.from('posts').insert(payload).select().single();
    if (error) {
      throw new Error(`createPost 오류: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Post 수정
export const updatePost = async (
  id: number,
  editTitle: Omit<PostUpdate, 'user_id'>,
): Promise<Post> => {
  const { data, error } = await supabase
    .from('posts')
    .update({ ...editTitle, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data)
    throw new Error(`updatePost 오류: ${error?.message || '게시글 업데이트 실패'}`);

  return data;
};

// Post 삭제
export const deletePost = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      throw new Error(`deletePost 오류: ${error.message}`);
    }
  } catch (error) {
    console.log(error);
  }
};
