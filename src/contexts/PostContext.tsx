import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Post } from '../types/database';
import {
  getPosts,
  createPost,
  updatePost as updatePostService,
  deletePost,
} from '../services/postService';
import type { PostInsert } from '../types/post';

// 1. 상태 타입 정의
type PostState = {
  posts: Post[];
  loading: boolean;
  error: string | null;
};

// 2. 액션 타입 정의
enum PostActionType {
  ADD = 'ADD',
  DELETE = 'DELETE',
  UPDATE = 'UPDATE',
  SET_POSTS = 'SET_POSTS',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
}

type AddAction = { type: PostActionType.ADD; payload: { post: Post } };
type DeleteAction = { type: PostActionType.DELETE; payload: { id: number } };
type UpdateAction = { type: PostActionType.UPDATE; payload: { post: Post } };
type SetPostAction = { type: PostActionType.SET_POSTS; payload: { posts: Post[] } };
type SetLoadingAction = { type: PostActionType.SET_LOADING; payload: boolean };
type SetErrorAction = { type: PostActionType.SET_ERROR; payload: string | null };

type PostAction =
  | AddAction
  | DeleteAction
  | UpdateAction
  | SetPostAction
  | SetLoadingAction
  | SetErrorAction;

// 3. 리듀서 함수
function postReducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case PostActionType.ADD:
      return { ...state, posts: [action.payload.post, ...state.posts] };

    case PostActionType.UPDATE:
      return {
        ...state,
        posts: state.posts.map(p => (p.id === action.payload.post.id ? action.payload.post : p)),
      };

    case PostActionType.DELETE:
      return { ...state, posts: state.posts.filter(p => p.id !== action.payload.id) };

    case PostActionType.SET_POSTS:
      return { ...state, posts: action.payload.posts };

    case PostActionType.SET_LOADING:
      return { ...state, loading: action.payload };

    case PostActionType.SET_ERROR:
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// 4. Context 생성
type PostContextType = {
  state: PostState;
  fetchPosts: () => Promise<void>;
  addPost: (post: PostInsert) => Promise<void>;
  updatePost: (post: Post) => Promise<void>;
  removePost: (id: number) => Promise<void>;
};

const PostContext = createContext<PostContextType | undefined>(undefined);

// 5. Provider 생성
export const PostProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(postReducer, {
    posts: [],
    loading: false,
    error: null,
  });

  // 게시글 불러오기
  const fetchPosts = async () => {
    dispatch({ type: PostActionType.SET_LOADING, payload: true });
    try {
      const data = await getPosts();
      dispatch({ type: PostActionType.SET_POSTS, payload: { posts: data } });
    } catch (err) {
      dispatch({
        type: PostActionType.SET_ERROR,
        payload: '게시글을 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      dispatch({ type: PostActionType.SET_LOADING, payload: false });
    }
  };

  // 게시글 추가
  const addPost = async (post: PostInsert) => {
    try {
      const newPost = await createPost(post);
      if (!newPost) throw new Error('게시글 생성 실패');
      dispatch({ type: PostActionType.ADD, payload: { post: newPost } });
    } catch (err) {
      console.log(err);
      // dispatch({ type: PostActionType.SET_ERROR, payload: '게시글 생성 중 오류가 발생했습니다.' });
    }
  };

  // 게시글 수정
  const updatePost = async (post: Post) => {
    try {
      const updated = await updatePostService(post.id, {
        title: post.title,
        content: post.content,
      });
      if (!updated) {
        throw new Error('게시글 업데이트 실패');
      }
      dispatch({ type: PostActionType.UPDATE, payload: { post: updated } });
    } catch {
      dispatch({
        type: PostActionType.SET_ERROR,
        payload: '게시글을 수정하는 중 문제가 발생했습니다.',
      });
    }
  };

  // 게시글 삭제
  const removePost = async (id: number) => {
    try {
      await deletePost(id);
      dispatch({ type: PostActionType.DELETE, payload: { id } });
    } catch {
      dispatch({
        type: PostActionType.SET_ERROR,
        payload: '게시글을 삭제하는 중 문제가 발생했습니다.',
      });
    }
  };

  // 처음 마운트 시 게시글 불러오기
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <PostContext.Provider value={{ state, fetchPosts, addPost, updatePost, removePost }}>
      {children}
    </PostContext.Provider>
  );
};

// 6. Custom Hook
export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) throw new Error('usePosts는 PostProvider 안에서만 사용할 수 있습니다.');
  return context;
};
