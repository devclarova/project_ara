import { BookOpen } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  let classes = 'btn';

  if (variant === 'primary') classes += ' btn-primary';
  if (variant === 'outline') classes += ' btn-outline';
  if (variant === 'ghost') classes += ' btn-ghost';
  if (variant === 'danger') classes += ' btn-danger';

  if (size === 'sm') classes += ' btn-sm';
  if (size === 'lg') classes += ' btn-lg';

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

type CardProps = {
  id?: string | number;
  image?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  actions?: React.ReactNode;
};

export function Card({ id, image, title, subtitle, meta, actions }: CardProps) {
  const content = (
    <div className="group relative ">
      <div className="card__media">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="bg-gray-200 w-full h-full" />
        )}
      </div>
      <div className="card__body">
        <div className="card__content">
          <h3 className="card__title">{title}</h3>
          <p className="card__subtitle">{subtitle}</p>
        </div>
        {meta && <p className="card__meta">{meta}</p>}
        {actions}
      </div>
      {/* Hover 오버레이 */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/90 opacity-0 group-hover:opacity-100 transition"></div>{' '}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-primary/30 opacity-0 group-hover:opacity-100 transition"></div>{' '}
      {/* Hover 내용(중앙 요약 박스) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <div className="bg-white/85 backdrop-blur-sm rounded-lg w-56 sm:w-64 md:w-72 h-72 sm:h-80 p-4 text-center flex flex-col justify-center gap-4">
          <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
          <div className="mt-1 text-xs text-gray-600 line-clamp-2">{subtitle}</div>
          <div className="mt-1 text-xs text-gray-500">{meta}</div>
          <div className="text-xs text-gray-500">{actions}</div>
        </div>
      </div>
    </div>
  );

  return id ? (
    <Link to={`/study/${id}`} className="card block hover:shadow-2">
      {content}
    </Link>
  ) : (
    <div className="card">{content}</div>
  );
}

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  let classes = 'badge';

  if (variant === 'brand') classes += ' brand';
  if (variant === 'success') classes += ' success';
  if (variant === 'warning') classes += ' bg-yellow-100 text-yellow-700 border-none';
  if (variant === 'danger') classes += ' bg-red-100 text-red-700 border-none';

  return <span className={classes}>{children}</span>;
}

// 홈페이지 Mock
const mockCourses = [
  {
    id: 1,
    image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/l0kCHPN8COTu7zxl8dUk0M4u99K.jpg',
    title: '드라마 대사로 배우는 한국어',
    subtitle: '실제 드라마 속 대화로 배우는 자연스러운 한국어',
    meta: '강사: 김영희 · ★ 4.9 · 수강생 800+',
    level: '초급',
    category: '드라마',
    views: 800,
    recommended: 95,
    createdAt: '2024-01-10',
  },
  {
    id: 2,
    image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/192WMVTyflBqQ7wsC8OTisClJAg.jpg',
    title: '비즈니스 한국어',
    subtitle: '오피스 상황에서 필요한 회화와 문서 작성',
    meta: '강사: 홍길동 · ★ 4.7 · 수강생 1,200+',
    level: '중급',
    category: '비즈니스',
    views: 1200,
    recommended: 88,
    createdAt: '2024-02-05',
  },
  {
    id: 3,
    image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/oofhXCgIRtzHww9a5aYUk4xCR2Q.jpg',
    title: '한국 문화 이해하기',
    subtitle: '예능과 뉴스 클립으로 배우는 문화적 맥락',
    meta: '강사: 이수민 · ★ 4.8 · 수강생 950+',
    level: '고급',
    category: '문화',
    views: 950,
    recommended: 92,
    createdAt: '2024-03-01',
  },
  {
    id: 4,
    image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/jnUOKXQwvIdFcG3hyVjNRi5Q5Hn.jpg',
    title: 'TOPIK 준비반',
    subtitle: '실전 문제 풀이 & 시험 전략',
    meta: '강사: 박민수 · ★ 4.6 · 수강생 600+',
    level: '고급',
    category: '시험 대비',
    views: 600,
    recommended: 90,
    createdAt: '2024-03-15',
  },
  {
    id: 5,
    image: 'https://placehold.co/600x400',
    title: 'TOPIK 준비반',
    subtitle: '실전 문제 풀이 & 시험 전략',
    meta: '강사: 박민수 · ★ 4.6 · 수강생 600+',
    level: '고급',
    category: '시험 대비',
    views: 600,
    recommended: 90,
    createdAt: '2024-03-15',
  },
];

// const mockCourses: any[] = []; // 빈 배열 → 학습한 강의 없음 상태
const mockRecommended = [
  {
    id: 4,
    image: 'https://placehold.co/600x400',
    title: 'TOPIK 준비반',
    subtitle: '실전 문제 풀이 & 시험 전략',
    meta: '강사: 박민수 · ★ 4.6 · 수강생 600+',
    level: '고급',
    category: '시험 대비',
    views: 600,
    recommended: 90,
    createdAt: '2024-03-15',
  },
  {
    id: 5,
    image: 'https://placehold.co/600x400',
    title: 'TOPIK 준비반',
    subtitle: '실전 문제 풀이 & 시험 전략',
    meta: '강사: 박민수 · ★ 4.6 · 수강생 600+',
    level: '고급',
    category: '시험 대비',
    views: 600,
    recommended: 90,
    createdAt: '2024-03-15',
  },
];

const TempHomePage = () => {
  if (mockCourses.length === 0) {
    // 학습 기록 없음 상태
    return (
      <div className="container py-12">
        {/* 안내 영역 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <BookOpen className="w-12 h-12 " style={{ color: 'var(--color-brand)' }} />
          </div>
          <h1 className="h1 mb-4">학습을 시작해 보세요</h1>
          <p className="text-gray-600 mb-6">
            아직 학습 기록이 없어요. <br />
            마음에 드는 강의를 선택하고 첫 학습을 시작해 보세요.
          </p>

          <Button variant="primary" size="lg">
            <Link to="/courses">강의 둘러보기</Link>
          </Button>
        </div>

        {/* 추천 강의 섹션 */}
        <div>
          <h2 className="h2 mb-6">추천 강의</h2>
          <div className="grid-cards">
            {mockRecommended.map(course => (
              <Link key={course.id} to={`/courses/${course.id}`}>
                <Card
                  id={course.id}
                  image={course.image}
                  title={course.title}
                  subtitle={course.subtitle}
                  meta={course.meta}
                  actions={<Badge variant="brand">{course.level}</Badge>}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 최근 학습한 강의 (createdAt 최신순 4개)
  const recentCourses = [...mockCourses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="container py-12 space-y-16">
      {/* 최근 학습한 강의 */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="h2">최근 학습한 강의</h2>
          <Link to="/studylist">
            <Button variant="outline" size="sm">
              모두 보기
            </Button>
          </Link>
        </div>
        <div className="grid-cards">
          {recentCourses.map(course => (
            <Link key={course.id} to={`/course/${course.id}`}>
              <Card
                id={course.id}
                image={course.image}
                title={course.title}
                subtitle={course.subtitle}
                meta={course.meta}
                actions={<Badge variant="brand">{course.level}</Badge>}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* 내 학습 강의 전체 */}
      <section>
        <h2 className="h2 mb-6">내 학습 강의 전체</h2>
        <div className="grid-cards">
          {mockCourses.map(course => (
            <Link key={course.id} to={`/course/${course.id}`}>
              <Card
                id={course.id}
                image={course.image}
                title={course.title}
                subtitle={course.subtitle}
                meta={course.meta}
                actions={<Badge variant="brand">{course.level}</Badge>}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TempHomePage;
