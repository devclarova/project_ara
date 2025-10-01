import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock,
  CheckSquare,
  Star,
  Pencil,
  ChevronRight,
  Bell,
  Shield,
  Settings,
  BookMarked,
} from 'lucide-react';

/**
 * ProfilePage
 * - 좌측: 프로필 카드 + 간단 통계 + 계정 설정 링크
 * - 우측: 학습 통계(SVG) + 탭(작성/좋아요)
 */

// ---------- Types ----------
type ProfileRow = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  birthday: string | null;
  gender: string;
  country: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProgressRow = {
  user_id: string;
  study_id: number | null;
  completed_lessons: number | null;
  total_lessons: number | null;
  progress_rate: number | null;
};

type PostRow = {
  id: number;
  user_id: string | null;
  category: string;
  title: string;
  content: string;
  like: number;
  view: number;
  comments: number | null;
  created_at: string;
};

type LikedPost = {
  created_at: string;
  posts: PostRow;
};

// ---------- Utils ----------
function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n);
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}일 전`;
  return d.toLocaleDateString();
}

function classNames(...arr: (string | false | null | undefined)[]) {
  return arr.filter(Boolean).join(' ');
}

// 샘플 차트 데이터
const defaultChart = [30, 20, 25, 60, 150, 180, 140];

function buildAreaPath(values: number[], width = 560, height = 220, padding = 24) {
  if (!values.length) return '';
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const max = Math.max(...values) || 1;
  const stepX = innerW / (values.length - 1 || 1);

  const points = values.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + innerH - (v / max) * innerH;
    return [x, y];
  });

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i][0]} ${points[i][1]}`;
  d += ` L ${padding + innerW} ${padding + innerH} L ${padding} ${padding + innerH} Z`;
  return d;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [authoredPosts, setAuthoredPosts] = useState<PostRow[]>([]);
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'authored' | 'liked'>('authored');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- derived stats ----------
  const completedLessons = useMemo(
    () => progressRows.reduce((acc, r) => acc + (r.completed_lessons || 0), 0),
    [progressRows],
  );
  const totalLessons = useMemo(
    () => progressRows.reduce((acc, r) => acc + (r.total_lessons || 0), 0),
    [progressRows],
  );
  const progressRate = useMemo(() => {
    if (totalLessons <= 0) return 0;
    return Math.round((completedLessons / totalLessons) * 100);
  }, [completedLessons, totalLessons]);

  const studyHours = useMemo(() => Math.round((completedLessons * 30) / 60), [completedLessons]);
  const points = useMemo(
    () => completedLessons * 60 + (authoredPosts?.length || 0) * 10,
    [completedLessons, authoredPosts],
  );

  const chartValues = useMemo(() => defaultChart, []);
  const areaPath = useMemo(() => buildAreaPath(chartValues), [chartValues]);

  // ---------- data fetch ----------
  useEffect(() => {
    let ignore = false;

    async function fetchAll() {
      if (!user) return;
      setLoading(true);
      try {
        // 프로필
        const { data: p, error: pErr } = await supabase
          .from('profiles')
          .select(
            'user_id, nickname, avatar_url, birthday, gender, country, created_at, updated_at',
          )
          .eq('user_id', user.id)
          .maybeSingle();
        if (pErr) throw pErr;

        // 진행도
        const { data: prog, error: gErr } = await supabase
          .from('progress')
          .select('user_id, study_id, completed_lessons, total_lessons, progress_rate')
          .eq('user_id', user.id);
        if (gErr) throw gErr;

        // 내가 쓴 글
        const { data: posts, error: postErr } = await supabase
          .from('posts')
          .select('id, user_id, category, title, content, like, view, comments, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (postErr) throw postErr;

        // 내가 좋아요한 글 (post_likes 조인)
        type RawLikedRow = { created_at: string; posts: PostRow | null };
        const { data: likedRaw, error: likedErr } = await supabase
          .from('post_likes')
          .select(
            `
              created_at,
              posts:posts!post_likes_post_id_fkey(
                id, user_id, category, title, content, like, view, comments, created_at
              )
            `,
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (likedErr) throw likedErr;

        if (!ignore) {
          setProfile(p || null);
          setProgressRows(prog || []);
          setAuthoredPosts(posts || []);
          const normalized = ((likedRaw ?? []) as RawLikedRow[]).filter(
            r => r.posts !== null,
          ) as LikedPost[];
          setLikedPosts(normalized);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      ignore = true;
    };
  }, [user]);

  // ---------- avatar upload ----------
  async function onPickAvatar() {
    fileInputRef.current?.click();
  }

  async function onAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있어요.');
      return;
    }
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

      const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data: pub } = await supabase.storage.from('avatars').getPublicUrl(filePath);
      const url = pub.publicUrl;

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('user_id', user.id);
      if (updErr) throw updErr;

      setProfile(prev => (prev ? { ...prev, avatar_url: url } : prev));
    } catch (e: any) {
      console.error(e);
      alert(e.message || '아바타 업로드에 실패했어요.');
    } finally {
      e.target.value = '';
    }
  }

  // ---------- UI ----------
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-2xl border bg-white p-10 text-center">
          <p className="text-lg">로그인이 필요합니다.</p>
          <button
            onClick={() => navigate('/signin')}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={profile?.avatar_url || '/images/default_avatar.png'}
                  alt="avatar"
                  className="w-24 h-24 rounded-2xl object-cover border"
                />
                <button
                  onClick={onPickAvatar}
                  className="absolute -bottom-2 -right-2 p-2 rounded-full bg-primary text-white shadow hover:opacity-90"
                  title="아바타 변경"
                >
                  <Pencil size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarSelected}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{profile?.nickname || '닉네임'}</h2>
                <div className="inline-flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-pink-100 text-pink-600 font-semibold">
                    Level {Math.max(1, Math.floor(progressRate / 5))}
                  </span>
                  <span className="text-xs text-gray-500">
                    가입:{' '}
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600 min-h-[20px]">
                  {[profile?.country, profile?.gender, profile?.birthday]
                    .filter(Boolean)
                    .join(' · ') || '소개가 아직 없어요.'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Clock size={16} /> 총 학습 시간
                </div>
                <div className="mt-2 text-lg font-semibold">{formatNumber(studyHours)}시간</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <CheckSquare size={16} /> 완료한 학습
                </div>
                <div className="mt-2 text-lg font-semibold">{formatNumber(completedLessons)}개</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Star size={16} /> 획득 포인트
                </div>
                <div className="mt-2 text-lg font-semibold">{formatNumber(points)} P</div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="rounded-2xl border bg-white p-6">
            <h3 className="font-semibold text-gray-900 mb-4">계정 설정</h3>
            <ul className="divide-y">
              <li>
                <button
                  onClick={() => navigate('/settings/profile')}
                  className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-xl px-2"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <Pencil size={18} /> 프로필 설정
                  </span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/settings/notifications')}
                  className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-xl px-2"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <Bell size={18} /> 알림 설정
                  </span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/settings/privacy')}
                  className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-xl px-2"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <Shield size={18} /> 개인정보 설정
                  </span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/settings/learning')}
                  className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-xl px-2"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <Settings size={18} /> 학습 설정
                  </span>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart */}
          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">학습 통계</h3>
              <div className="text-sm text-gray-500">최근 일주일</div>
            </div>
            <div className="relative overflow-hidden">
              <svg width="100%" viewBox="0 0 560 220" className="rounded-xl">
                <defs>
                  <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00BFA5" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00BFA5" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="560" height="220" fill="url(#bgGrad)" fillOpacity="0" />
                <path d={areaPath} fill="url(#areaFill)" stroke="#00BFA5" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-2xl border bg-white">
            <div className="p-4 border-b flex items-center gap-2">
              <button
                className={classNames(
                  'px-3 py-1.5 rounded-lg text-sm font-medium',
                  tab === 'authored'
                    ? 'bg-pink-100 text-pink-700'
                    : 'text-gray-600 hover:bg-gray-50',
                )}
                onClick={() => setTab('authored')}
              >
                작성한 게시글
              </button>
              <button
                className={classNames(
                  'px-3 py-1.5 rounded-lg text-sm font-medium',
                  tab === 'liked' ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-50',
                )}
                onClick={() => setTab('liked')}
              >
                좋아요한 게시글
              </button>
            </div>

            <div className="p-4">
              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading &&
                tab === 'authored' &&
                (authoredPosts.length ? (
                  <ul className="space-y-3">
                    {authoredPosts.map(p => (
                      <li
                        key={p.id}
                        className="rounded-xl border p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            <BookMarked size={14} /> {p.category}
                          </span>
                          <span>· {timeAgo(p.created_at)}</span>
                        </div>
                        <h4 className="mt-2 font-semibold text-gray-900 line-clamp-1">{p.title}</h4>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">{p.content}</p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>조회 {formatNumber(p.view)}</span>
                          <span>좋아요 {formatNumber(p.like)}</span>
                          <span>댓글 {formatNumber(p.comments || 0)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 py-8">작성한 게시글이 없어요.</div>
                ))}

              {!loading &&
                tab === 'liked' &&
                (likedPosts.length ? (
                  <ul className="space-y-3">
                    {likedPosts.map((lp, idx) => (
                      <li
                        key={`${lp.posts.id}-${idx}`}
                        className="rounded-xl border p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                            ❤
                          </span>
                          <span>· {timeAgo(lp.created_at)}</span>
                        </div>
                        <h4 className="mt-2 font-semibold text-gray-900 line-clamp-1">
                          {lp.posts.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                          {lp.posts.content}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>조회 {formatNumber(lp.posts.view)}</span>
                          <span>좋아요 {formatNumber(lp.posts.like)}</span>
                          <span>댓글 {formatNumber(lp.posts.comments || 0)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 py-8">좋아요한 게시글이 없어요.</div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
