import { Clock, Flame, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Stats = {
  due: number; // 오늘 복습 예정 개수
  newWords: number; // 오늘 추가한 단어 수
  streak: number; // 연속 학습 일수
  dailyGoal: number; // 오늘 목표(단어 수)
  completedToday: number; // 오늘 완료(단어 수)
};

const Greeting = ({ userName = '미정', stats }: { userName?: string; stats?: Partial<Stats> }) => {
  const { t, i18n } = useTranslation();
  const now = new Date();
  
  const getGreeting = (d: Date) => {
    const h = d.getHours();
    if (h < 6) return t('home.greeting_night');
    if (h < 12) return t('home.greeting_morning');
    if (h < 18) return t('home.greeting_afternoon');
    return t('home.greeting_evening');
  };

  const formatLocaleDate = (d: Date) => {
    return new Intl.DateTimeFormat(i18n.language === 'ko' ? 'ko-KR' : 'en-US', { dateStyle: 'full' }).format(d);
  };

  const greetingText = getGreeting(now);
  const dateText = formatLocaleDate(now);

  const { due = 18, newWords = 5, streak = 7, dailyGoal = 20, completedToday = 15 } = { ...stats };

  const progress = Math.min(100, Math.round((completedToday / dailyGoal) * 100));
  const r = 40;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - progress / 100);

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {greetingText}, {userName === '미정' ? t('common.unknown') : userName}{i18n.language === 'ko' ? '님!' : '!'}
          </h1>
          <p className="text-gray-600">{dateText}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <StatPill
              icon={<Clock className="w-4 h-4" />}
              label={t('home.stats_due')}
              value={`${due}${t('common.count_unit', '개')}`}
            />
            <StatPill
              icon={<Plus className="w-4 h-4" />}
              label={t('home.stats_new')}
              value={`${newWords}${t('common.count_unit', '개')}`}
            />
            <StatPill
              icon={<Flame className="w-4 h-4" />}
              label={t('home.stats_streak')}
              value={`${streak}${t('common.day_unit', '일')}`}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 mb-3">
            <svg viewBox="0 0 100 100" className="w-24 h-24">
              <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                className="text-primary transition-[stroke-dashoffset] duration-500"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-xl font-bold text-primary">{progress}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-600">{t('home.goal_text', { count: dailyGoal })}</p>
        </div>
      </div>
    </div>
  );
};

const StatPill = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border text-gray-700">
    {icon}
    <span className="text-gray-500">{label}</span>
    <strong className="text-gray-900">{value}</strong>
  </span>
);

interface ProgressCardProps {
  title: string;
  episode: string;
  progress: number;
  timeLeft: string;
  color?: string;
  image: string;
}

const ProgressCard = ({
  title,
  episode,
  progress,
  timeLeft,
  color = 'primary',
  image,
}: ProgressCardProps) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="aspect-video relative">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{episode}</p>
        <div className="flex items-center justify-between">
          <span className={`text-${color}-500 font-semibold`}>
            {t('home.percent_complete', { percent: progress })}
          </span>
          <span className="text-gray-500 text-sm">
            {t('home.time_left', { time: timeLeft })}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`bg-${color}-500 h-2 rounded-full`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const RecentProgress = () => {
  const { t } = useTranslation();
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('home.recent_progress')}</h2>
        <a
          href="#"
          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {t('home.continue_learning')} <i className="ri-arrow-right-line"></i>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressCard
          title="우리들의 블루스"
          episode="Episode 5 · Scene 3"
          progress={75}
          timeLeft="15분"
          color="primary"
          image="https://media.themoviedb.org/t/p/w500/dVjF6Dsks9fBji0P4bLbPJ6E0KE.jpg"
        />
        <ProgressCard
          title="놀면 뭐하니?"
          episode="Episode 2 · Scene 1"
          progress={30}
          timeLeft="25분"
          color="orange"
          image="https://media.themoviedb.org/t/p/w500/hTFgTMcB2LX9F5L1j1n3I8GY8Vt.jpg"
        />
        <ProgressCard
          title="기생충"
          episode="Episode 1 · Scene 2"
          progress={60}
          timeLeft="20분"
          color="green"
          image="https://media.themoviedb.org/t/p/w500/xZTP6fWXjHH0qy4n6iBtEdNsBkn.jpg"
        />
      </div>
    </section>
  );
};

interface RecommendationCardProps {
  title: string;
  episode: string;
  duration: string;
  recommendRate: string;
  image: string;
  badge?: { text: string; color: string };
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  episode,
  duration,
  recommendRate,
  image,
  badge,
}) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="aspect-video relative">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        {badge && (
          <div
            className={`absolute top-3 left-3 bg-${badge.color}-500 text-white px-2 py-1 rounded text-xs font-semibold`}
          >
            {badge.text}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{episode}</p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <i className="ri-time-line"></i>
            {duration}
          </span>
          <span className="flex items-center gap-1">
            <i className="ri-eye-line"></i>
            {recommendRate} {t('common.recommend', '추천')}
          </span>
        </div>
      </div>
    </div>
  );
};

const Recommendations = () => {
  const { t } = useTranslation();
  const imgSrc = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d';
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('home.today_recommendation')}</h2>
        <a
          href="#"
          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {t('home.more')} <i className="ri-arrow-right-line"></i>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecommendationCard
          title="도깨비"
          episode="Episode 1 · Scene 4"
          duration="8분"
          recommendRate="94%"
          image={imgSrc}
          badge={{ text: 'NEW', color: 'primary' }}
        />
        <RecommendationCard
          title="무한도전"
          episode="Episode 3 · Scene 2"
          duration="12분"
          recommendRate="86%"
          image={imgSrc}
        />
        <RecommendationCard
          title="KBS 뉴스"
          episode="Episode 2 · Scene 1"
          duration="15분"
          recommendRate="92%"
          image={imgSrc}
          badge={{ text: 'LIVE', color: 'red' }}
        />
      </div>
    </section>
  );
};

const HomePage = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-white min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Greeting />
        <RecentProgress />
        <Recommendations />
        <section className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('home.weekly_stats')}</h3>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('home.field_progress')}</h3>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
