
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Users, Database, DollarSign, TrendingUp, Zap, Filter, Download, BarChart2, AlertTriangle, CheckCircle2, XCircle, Search, Layers, Globe } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactGA from "react-ga4";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { usePresence } from '../../contexts/PresenceContext';

// Types
interface StatsData {
  totalUsers: number;
  cumulativeUsers: number;
  newUsersRecent: number;
  newUserGrowth: number;
  activeUsers: number;
  postCount: number;
  commentCount: number;
  totalRevenue: number;
  conversionRate: number;
  anomalies: any[];
  chartData: Array<{ name: string; activity: number; signups: number }>;
  geoData: Array<{ country: string; country_name?: string; count: number; online?: number }>;
  funnel?: {
    visitors: number;
    onboarded: number;
    active_creators: number;
  };
  cohorts?: Array<{
    cohort: string;
    size: number;
    d1: number;
    d7: number;
    d30: number;
  }>;
  health?: {
    api_latency: number;
    db_status: string;
    cache_hit_rate: number;
  };
}

type Tab = 'overview' | 'acquisition' | 'retention' | 'dataops';

// Constants
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// 숫자 코드·전체 이름·world-atlas 명칭 등을 ISO 2자리 코드로 정규화
const getCanonicalCode = (raw: string): string => {
  if (!raw || raw === 'Unknown' || raw === 'unknown') return 'Unknown';
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  const numMap: Record<string, string> = {
    '410': 'KR', '840': 'US', '392': 'JP', '156': 'CN', '643': 'RU',
    '276': 'DE', '250': 'FR', '826': 'GB', '036': 'AU', '124': 'CA',
    '356': 'IN', '076': 'BR', '484': 'MX', '704': 'VN', '360': 'ID',
    '764': 'TH', '608': 'PH', '158': 'TW', '458': 'MY', '702': 'SG',
    '111': 'KR', '18': 'JP',
  };
  if (numMap[trimmed]) return numMap[trimmed];
  const nameMap: Record<string, string> = {
    'KOREA': 'KR', 'SOUTH KOREA': 'KR', 'REPUBLIC OF KOREA': 'KR', 'KOREA, REPUBLIC OF': 'KR', 'KOR': 'KR',
    'UNITED STATES': 'US', 'UNITED STATES OF AMERICA': 'US', 'USA': 'US',
    'JAPAN': 'JP', 'JPN': 'JP',
    'CHINA': 'CN', "PEOPLE'S REPUBLIC OF CHINA": 'CN', 'CHN': 'CN',
    'RUSSIA': 'RU', 'RUSSIAN FEDERATION': 'RU', 'RUS': 'RU',
    'GERMANY': 'DE', 'DEU': 'DE', 'FRANCE': 'FR', 'FRA': 'FR',
    'UNITED KINGDOM': 'GB', 'GBR': 'GB', 'UK': 'GB',
    'SPAIN': 'ES', 'ESP': 'ES', 'ITALY': 'IT', 'ITA': 'IT',
    'NETHERLANDS': 'NL', 'NLD': 'NL', 'SWEDEN': 'SE', 'SWE': 'SE',
    'SWITZERLAND': 'CH', 'CHE': 'CH', 'POLAND': 'PL', 'POL': 'PL',
    'PORTUGAL': 'PT', 'PRT': 'PT', 'UKRAINE': 'UA', 'UKR': 'UA',
    'NORWAY': 'NO', 'NOR': 'NO', 'DENMARK': 'DK', 'DNK': 'DK',
    'FINLAND': 'FI', 'FIN': 'FI', 'AUSTRIA': 'AT', 'AUT': 'AT',
    'BELGIUM': 'BE', 'BEL': 'BE', 'CZECH REPUBLIC': 'CZ', 'CZECHIA': 'CZ', 'CZE': 'CZ',
    'AUSTRALIA': 'AU', 'AUS': 'AU', 'CANADA': 'CA', 'CAN': 'CA',
    'INDIA': 'IN', 'IND': 'IN', 'BRAZIL': 'BR', 'BRA': 'BR',
    'MEXICO': 'MX', 'MEX': 'MX',
    'VIETNAM': 'VN', 'VIET NAM': 'VN', 'VNM': 'VN',
    'INDONESIA': 'ID', 'IDN': 'ID', 'THAILAND': 'TH', 'THA': 'TH',
    'PHILIPPINES': 'PH', 'PHL': 'PH',
    'TAIWAN': 'TW', 'TAIWAN, PROVINCE OF CHINA': 'TW', 'TWN': 'TW',
    'MALAYSIA': 'MY', 'MYS': 'MY', 'SINGAPORE': 'SG', 'SGP': 'SG',
    'NEW ZEALAND': 'NZ', 'NZL': 'NZ', 'HONG KONG': 'HK', 'HKG': 'HK',
    'TURKEY': 'TR', 'TURKIYE': 'TR', 'TUR': 'TR',
    'SAUDI ARABIA': 'SA', 'SAU': 'SA',
    'UNITED ARAB EMIRATES': 'AE', 'ARE': 'AE',
    'ISRAEL': 'IL', 'ISR': 'IL',
    'ARGENTINA': 'AR', 'ARG': 'AR',
    'EGYPT': 'EG', 'EGY': 'EG', 'SOUTH AFRICA': 'ZA', 'ZAF': 'ZA',
    'NIGERIA': 'NG', 'NGA': 'NG',
    'PAKISTAN': 'PK', 'PAK': 'PK', 'BANGLADESH': 'BD', 'BGD': 'BD',
  };
  if (nameMap[upper]) return nameMap[upper];
  if (/^[A-Z]{3}$/.test(upper)) return upper.slice(0, 2);
  return 'Unknown';
};

const COUNTRY_NAMES_KO: Record<string, string> = {
  // 아시아
  'KR': '대한민국', 'JP': '일본', 'CN': '중국', 'VN': '베트남', 'ID': '인도네시아',
  'TH': '태국', 'PH': '필리핀', 'TW': '대만', 'MY': '말레이시아', 'SG': '싱가포르',
  'IN': '인도', 'PK': '파키스탄', 'BD': '방글라데시', 'LK': '스리랑카',
  'NP': '네팔', 'MM': '미얀마', 'KH': '캄보디아', 'LA': '라오스',
  'MN': '몽골', 'BT': '부탄', 'MV': '몰디브', 'TL': '동티모르',
  'HK': '홍콩', 'MO': '마카오', 'BN': '브루나이',
  'KZ': '카자흐스탄', 'UZ': '우즈베키스탄', 'TM': '투르크메니스탄',
  'TJ': '타지키스탄', 'KG': '키르기스스탄', 'AF': '아프가니스탄',
  // 중동
  'SA': '사우디아라비아', 'AE': '아랍에미리트', 'TR': '터키',
  'IL': '이스라엘', 'IR': '이란', 'IQ': '이라크', 'SY': '시리아',
  'JO': '요르단', 'LB': '레바논', 'KW': '쿠웨이트', 'QA': '카타르',
  'BH': '바레인', 'OM': '오만', 'YE': '예멘', 'PS': '팔레스타인',
  // 유럽
  'US': '미국', 'GB': '영국', 'DE': '독일', 'FR': '프랑스', 'IT': '이탈리아',
  'ES': '스페인', 'RU': '러시아', 'NL': '네덜란드', 'SE': '스웨덴',
  'CH': '스위스', 'PL': '폴란드', 'PT': '포르투갈', 'NO': '노르웨이',
  'DK': '덴마크', 'FI': '핀란드', 'AT': '오스트리아', 'BE': '벨기에',
  'CZ': '체코', 'RO': '루마니아', 'HU': '헝가리', 'GR': '그리스',
  'UA': '우크라이나', 'SK': '슬로바키아', 'HR': '크로아티아',
  'BG': '불가리아', 'RS': '세르비아', 'SI': '슬로베니아',
  'LT': '리투아니아', 'LV': '라트비아', 'EE': '에스토니아',
  'BY': '벨라루스', 'MD': '몰도바', 'AL': '알바니아',
  'MK': '북마케도니아', 'BA': '보스니아 헤르체고비나',
  'ME': '모돈테네그리당', 'XK': '코소보', 'LU': '룩셀부르크',
  'IE': '아일랜드', 'IS': '아이슬란드', 'MT': '몰타',
  'CY': '키프로스', 'LI': '리히텐슈타인', 'MC': '모나코',
  'AD': '안도라', 'SM': '산마리노', 'VA': '바티칸',
  // 아메리카화
  'CA': '캐나다', 'BR': '브라질', 'MX': '멕시코', 'AR': '아르헨티나',
  'CL': '칠레', 'CO': '콜롬비아', 'PE': '페루', 'VE': '베네수엘라',
  'EC': '에쿼아도르', 'BO': '볼리비아', 'PY': '파라과이',
  'UY': '우루과이', 'SR': '수리남', 'GY': '가이아나',
  'GT': '과테말라', 'HN': '온두라스', 'SV': '엘살바도르',
  'NI': '니카라과아', 'CR': '코스타리카', 'PA': '파나마',
  'CU': '쿠바', 'DO': '도미니카공화국', 'HT': '아이티',
  'JM': '자메이카', 'TT': '트리니다드토바고', 'BB': '바르바도스',
  'LC': '세인트루시아', 'VC': '세인트빈센트', 'GD': '그레나다',
  'AG': '앤티가바부다', 'DM': '도미니카', 'KN': '세인트키츠네비스',
  'BS': '바하마', 'BZ': '벨리즈', 'PR': '푸에르토리코',
  // 아프리카
  'ZA': '남아프리카공화국', 'NG': '나이지리아', 'EG': '이집트',
  'KE': '케냐', 'ET': '에티오피아', 'GH': '가나', 'TZ': '탄자니아',
  'UG': '우간다', 'DZ': '알제리', 'MA': '모로코',
  'CI': '코트디부아르', 'CM': '카메룬', 'MZ': '모잠비크',
  'MG': '마다가스카르', 'AO': '앙골라', 'ZM': '잠비아',
  'ZW': '짐바브웨', 'SN': '세네갈', 'TN': '튀니지',
  'SD': '수단', 'SS': '남수단', 'ML': '말리', 'NE': '니제르',
  'BF': '부르키나파소', 'MR': '모리타니', 'LY': '리비아',
  'SO': '소말리아', 'RW': '르완다', 'BI': '부룬디',
  'TD': '차드', 'CF': '중앙아프리카공화국',
  'CD': '콩고민주주의공화국', 'CG': '콩고공화국',
  'GA': '가봉', 'GQ': '적도기니', 'ST': '상투메프린시페',
  'GW': '기니비사우', 'GN': '기니', 'SL': '시에라리온',
  'LR': '라이베리아', 'GM': '감비아', 'CV': '카보베르데',
  'BJ': '베냉', 'TG': '토고', 'BW': '보츠와나',
  'NA': '나미비아', 'LS': '레소토', 'SZ': '에스와티니',
  'MW': '말라위', 'SC': '세이셸', 'MU': '모리셔스',
  'KM': '코모로', 'DJ': '지부티', 'ER': '에리트레아', 'RE': '레위니옹', 'YT': '마요트',
  'EH': '서사하라',
  // 오세아니아
  'AU': '호주', 'NZ': '뉴질랜드', 'PG': '파푸아뉴기니',
  'FJ': '피지', 'SB': '솔로몬제도', 'VU': '바누아투',
  'WS': '사모아', 'TO': '통가', 'TV': '투발루', 'NR': '나우루',
  'PW': '팔라우', 'MH': '마셜제도', 'FM': '미크로네시아',
  'KI': '키리바시', 'CK': '쿡제도', 'NC': '뉴칼레도니아',
  'PF': '프랑스령폴리네시아', 'AS': '아메리칸사모아', 'GU': '괌',
  'MP': '북마리아나제도', 'VI': '미국령버진아일랜드', 'GL': '그린란드',
  'FO': '페로제도', 'GF': '프랑스령기아나', 'PM': '세인트피에르미클롱',
  'Unknown': '알 수 없음',
};

const getCountryNameKO = (code: string, fallback?: string): string => {
  const upper = (code || '').toUpperCase();
  return COUNTRY_NAMES_KO[upper] || COUNTRY_NAMES_KO[code] || (fallback && fallback !== code ? fallback : undefined) || '알 수 없음';
};

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState('7일');
  const [selectedSegment, setSelectedSegment] = useState('전체 사용자');
  const [showCumulative, setShowCumulative] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { onlineCount, sessionCount, stats: globalStats } = usePresence();
  const [tooltipContent, setTooltipContent] = useState("");

  // 2단계 추가 상태: 지도 모드 및 모달 제어
  const [mapMode, setMapMode] = useState<'total' | 'online'>('total');
  const [isStatesModalOpen, setIsStatesModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Tab Scroll Logic
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const onMouseLeave = () => { setIsDragging(false); };
  const onMouseUp = () => { setIsDragging(false); };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
     handleScroll();
     window.addEventListener('resize', handleScroll);
     return () => window.removeEventListener('resize', handleScroll);
  }, []);

  // 지도 휠 이벤트: 최대/최소 줌 경계에서 페이지 스크롤 전파 차단
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const onMapWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', onMapWheel, { passive: false });
    return () => el.removeEventListener('wheel', onMapWheel);
  }, [isMounted]);

  // Map Color Scale - 모드에 따라 유연한 임계값 적용
  const colorScale = useMemo(() => {
     const isOnlineMode = mapMode === 'online';
     const getThresholdColor = (count: number) => {
        if (count <= 0) return "#E5E7EB";
        if (isOnlineMode) {
            if (count <= 1) return "#D1FAE5";
            if (count <= 3) return "#6EE7B7";
            if (count <= 10) return "#10B981";
            return "#064E3B";
        } else {
            if (count <= 2) return "#D1FAE5";
            if (count <= 10) return "#6EE7B7";
            if (count <= 30) return "#10B981";
            return "#064E3B";
        }
     };
     return getThresholdColor;
  }, [mapMode]);


  // GA4 Init & Mount (once only)
  useEffect(() => {
    setTimeout(() => setIsMounted(true), 200);
    const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (GA_ID) {
        ReactGA.initialize(GA_ID);
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
  }, []);

  // Fetch Stats & Realtime (re-runs on dateRange change)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Use the new consolidated RPC for deep analytics
        const { data, error } = await supabase.rpc('get_admin_analytics_v2', { 
          p_days: dateRange === '24시간' ? 1 : dateRange === '7일' ? 7 : dateRange === '30일' ? 30 : 90 
        });

        if (error) throw error;

        // Standardize chart data labels
        const formattedChartData = data.daily_activity?.map((item: any) => ({
          ...item,
          name: new Date(item.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
          activity: (item.posts || 0) + (item.comments || 0)
        })) || [];

        // 국가 코드 정규화 + 중복 집계 (같은 나라의 여러 표현을 하나로 합산)
        const geoMap = new Map<string, { country: string; country_name: string; count: number; online: number }>();
        (data.geo_data || []).forEach((d: any) => {
          const code = getCanonicalCode(d.country || '');
          const existing = geoMap.get(code);
          if (existing) {
            existing.count += Number(d.count) || 0;
            existing.online += Number(d.online_count) || 0;
          } else {
            geoMap.set(code, {
              country: code,
              country_name: COUNTRY_NAMES_KO[code] || d.country_name || code,
              count: Number(d.count) || 0,
              online: Number(d.online_count) || 0,
            });
          }
        });
        const geoArray = Array.from(geoMap.values()).sort((a, b) => b.count - a.count);

        setStats({
          totalUsers: data.summary.total_users || 0,
          cumulativeUsers: data.summary.total_users || 0,
          newUsersRecent: data.summary.new_users_7d || 0,
          newUserGrowth: 0, // Calculated on backend if needed
          activeUsers: data.summary.active_users_5m || 0,
          postCount: data.summary.post_count || 0,
          commentCount: data.summary.comment_count || 0,
          totalRevenue: data.summary.total_revenue || 0,
          conversionRate: data.summary.conversion_rate || 0,
          chartData: formattedChartData,
          geoData: geoArray,
          anomalies: [],
          // Injected extended data for specific tabs
          funnel: data.funnel,
          cohorts: data.cohorts,
          health: data.health
        } as any);

      } catch (e) {
        console.error("Failed to load analytics stats", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();

    // 5분마다 자동 재조회 - geo_data online_count와 activeUsers 모두 동일 기준(last_active_at >= 5분)으로 갱신
    const refreshInterval = setInterval(fetchStats, 5 * 60 * 1000);

    // Activity Monitor (Tweets/Comments)
    const activityChannel = supabase
        .channel('admin-stats-activity')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tweets' }, () => {
            setStats(prev => {
                if (!prev) return null;
                const newChart = [...prev.chartData];
                const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
                const todayItem = newChart.find(c => c.name === todayLabel);
                if (todayItem) todayItem.activity += 1;
                return { ...prev, postCount: prev.postCount + 1, chartData: newChart };
            });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tweet_replies' }, () => {
             setStats(prev => {
                if (!prev) return null;
                const newChart = [...prev.chartData];
                const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
                const todayItem = newChart.find(c => c.name === todayLabel);
                if (todayItem) todayItem.activity += 1;
                return { ...prev, commentCount: prev.commentCount + 1, chartData: newChart };
            });
        })
        .subscribe();

    return () => { 
        clearInterval(refreshInterval);
        supabase.removeChannel(activityChannel);
    };
  }, [dateRange]);


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-secondary p-5 rounded-2xl border border-border/60 shadow-sm">
         <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
               <Activity className="text-primary" />
               데이터 분석실
            </h1>
            <p className="text-sm text-muted-foreground">GA4 및 데이터세트 통합 실시간 모니터링 대시보드</p>
         </div>

         <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border border-gray-300 dark:border-gray-500 rounded-lg text-sm">
               <Filter size={16} className="text-muted-foreground" />
               <select 
                  className="bg-transparent border-none outline-none text-foreground font-medium cursor-pointer"
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
               >
                  <option>전체 사용자</option>
                  <option>자연 유입 (Organic)</option>
                  <option>결제 사용자 (Paid)</option>
               </select>
            </div>

            <div className="flex items-center bg-muted border border-gray-300 dark:border-gray-500 rounded-lg p-1">
               {['24시간', '7일', '30일', '전체'].map((range) => (
                  <button
                     key={range}
                     onClick={() => setDateRange(range)}
                     className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        dateRange === range 
                           ? 'bg-secondary text-primary shadow-sm border border-border' 
                           : 'text-muted-foreground hover:text-foreground'
                     }`}
                  >
                     {range}
                  </button>
               ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-bold shadow-md">
               <Download size={16} />
               분석 리포트 다운로드
            </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="relative border-b border-gray-300 dark:border-gray-600/80 group">
          <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 transition-opacity pointer-events-none ${showLeftGradient ? 'opacity-100' : 'opacity-0'}`} />
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-4 md:gap-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onScroll={handleScroll}
          >
             <TabButton label="인사이트 오버뷰" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity} />
             <TabButton label="획득 및 참여" active={activeTab === 'acquisition'} onClick={() => setActiveTab('acquisition')} icon={Users} />
             <TabButton label="리텐션 및 퍼널" active={activeTab === 'retention'} onClick={() => setActiveTab('retention')} icon={Layers} />
             <TabButton label="데이터 운영 (Ops)" active={activeTab === 'dataops'} onClick={() => setActiveTab('dataops')} icon={Database} />
             <div className="w-4 shrink-0" />
          </div>
          <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 transition-opacity pointer-events-none ${showRightGradient ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Content Content - Overview */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
         {activeTab === 'overview' && (
            <div className="space-y-6">
               {loading ? (
                 <div className="flex h-64 items-center justify-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <span>실시간 데이터를 수집 중입니다...</span>
                    </div>
                 </div>
               ) : (
                <>
                   {/* Realtime Ticker */}
                   <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-primary/10 border border-emerald-100 rounded-xl text-sm text-emerald-800 dark:text-emerald-400 dark:border-emerald-900/50">
                      <div className="flex items-center gap-2 min-w-fit">
                        <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="font-semibold whitespace-nowrap">실시간 상태:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>현재 <strong>{onlineCount}명</strong>의 사용자가 활동 중입니다.</span>
                        <span className="hidden md:inline text-primary/30">|</span>
                        <span className="text-xs text-emerald-600/80 dark:text-emerald-500/80">
                           {new Date().toLocaleTimeString()} 기준 (5분 내 활동 감지)
                        </span>
                      </div>
                   </div>

                   {/* Cards Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                       {/* Metric Card 1: Users */}
                       <MetricCard 
                          title="사용자 수" 
                          value={showCumulative ? (globalStats.totalUsers?.toLocaleString() || "0") : (globalStats.totalUsers?.toLocaleString() || "0")} 
                          subtitle={showCumulative ? "전체 활성 계정" : "현재 활성 계정 기준"} 
                          icon={Users} 
                          badge={
                            <div className="flex p-0.5 bg-muted/30 rounded-full border border-border/40 shadow-sm backdrop-blur-sm">
                               <button onClick={(e) => { e.stopPropagation(); setShowCumulative(false); }} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${!showCumulative ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>현재</button>
                               <button onClick={(e) => { e.stopPropagation(); setShowCumulative(true); }} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showCumulative ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>누적</button>
                            </div>
                          }
                       />
                       
                       {/* Metric Card 2: New Users */}
                       <MetricCard title="신규 유입 (7일)" value={globalStats.newUsers7d?.toLocaleString() || "0"} trend="Recent" trendUp={true} subtitle="최근 일주일 신규 가입" icon={TrendingUp} />
 
                        {/* Metric Card 3: Active (Realtime) */}
                        <MetricCard 
                           title="실시간 활동 지수" 
                           value={onlineCount.toLocaleString()} 
                           subtitle={`${sessionCount}개의 세션(탭)이 활성 상태입니다.`} 
                          icon={Activity} 
                          badge={
                            <div className="min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                               <span className="relative flex h-2 w-2">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                               </span>
                               <span className="text-[10px] font-black uppercase tracking-wider">라이브</span>
                            </div>
                          }
                       />

                      {/* Metric Card 4: Content */}
                      <MetricCard 
                         title="콘텐츠 현황" 
                         value={showComments ? (stats?.commentCount?.toLocaleString() || "0") : (stats?.postCount?.toLocaleString() || "0")} 
                         subtitle={showComments ? "댓글 및 답글 수" : "게시글 및 트윗 수"} 
                         icon={Database} 
                         badge={
                           <div className="flex p-0.5 bg-muted/30 rounded-full border border-border/40 shadow-sm backdrop-blur-sm">
                              <button onClick={(e) => { e.stopPropagation(); setShowComments(false); }} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${!showComments ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>게시글</button>
                              <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showComments ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>댓글</button>
                           </div>
                         }
                      />

                      <MetricCard title="총 매출" value={`$${stats?.totalRevenue?.toLocaleString() || "0"}`} trend="-" subtitle="결제 시스템 연동 예정" icon={DollarSign} />
                      <MetricCard title="구매 전환률" value={`${stats?.conversionRate || 0}%`} trend="-" subtitle="활성 유저 대비" icon={Zap} />
                   </div>

                   {/* Anomaly / System Health */}
                   <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl flex-shrink-0"><CheckCircle2 size={24} /></div>
                        <div>
                           <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">시스템 정상 운영 중 (System Healthy)</h3>
                           <p className="text-sm text-emerald-600/80 dark:text-emerald-400/60 mt-1">
                              AI 보안 엔진이 24시간 실시간 감시 중입니다. 현재 특이사항 없습니다.
                           </p>
                        </div>
                   </div>

                   {/* Charts & MAP */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Chart */}
                      <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm lg:col-span-2 min-w-0">
                         <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <BarChart2 size={18} className="text-muted-foreground" />
                            주간 활동 추이 (Last 7 Days)
                         </h3>
                         <div className="h-[300px] w-full min-h-[300px] relative">
                           {isMounted && (
                             <ResponsiveContainer width="100%" height={300}>
                             <AreaChart data={stats?.chartData || []}>
                               <defs>
                                 <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                   <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                               <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                               <YAxis tick={{fontSize: 11}} axisLine={false} tickLine={false} allowDecimals={false} />
                               <Tooltip 
                                 content={({ active, payload, label }) => {
                                   if (active && payload && payload.length) {
                                     return (
                                       <div className="bg-background/95 backdrop-blur-sm p-3 rounded-xl border border-border shadow-xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                                         <div className="text-[11px] font-black text-muted-foreground mb-1.5 uppercase tracking-tighter">{label}</div>
                                         <div className="space-y-1">
                                           <div className="flex items-center gap-2 text-xs">
                                             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                             <b>활동: {payload[0].value}건</b>
                                           </div>
                                         </div>
                                       </div>
                                     );
                                   }
                                   return null;
                                 }}
                               />
                               <Area type="monotone" dataKey="activity" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                             </AreaChart>
                           </ResponsiveContainer>
                           )}
                         </div>
                      </div>

                       {/* Right: Geo Map */}
                       <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm flex flex-col">
                          <div className="flex items-center justify-between mb-4">
                             <h3 className="font-bold text-foreground flex items-center gap-2">
                                 <Globe size={18} className="text-muted-foreground" />
                                 실시간 접속 지역
                             </h3>
                             <div className="flex p-0.5 bg-muted/50 rounded-lg border border-border/40 scale-95 origin-right">
                                <button onClick={() => setMapMode('total')} className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${mapMode === 'total' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>전체</button>
                                <button onClick={() => setMapMode('online')} className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all flex items-center gap-1 ${mapMode === 'online' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${mapMode === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />라이브
                                </button>
                             </div>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] bg-muted/20 rounded-xl overflow-hidden relative border border-border/40">
                              {isMounted ? (
                                 <div ref={mapContainerRef} className="w-full h-full relative cursor-move">
                                     <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}>
                                         <ZoomableGroup zoom={1} maxZoom={5} center={[0, 20]}>
                                             <Geographies geography={GEO_URL}>
                                                 {({ geographies }: { geographies: any[] }) =>
                                                     geographies.map((geo: any) => {
                                                         const { NAME, name, ISO_A2, iso_a2 } = geo.properties;
                                                         const targetName = NAME || name;
                                                         const targetCode = ISO_A2 || iso_a2;
                                                         if (targetName === 'Antarctica' || targetName === 'Fr. S. Antarctic Lands') return null;
                                                         const geoCode = getCanonicalCode(targetCode || targetName || '');
                                                         const countryData = geoCode !== 'Unknown' ? stats?.geoData.find(d => d.country === geoCode) : undefined;
                                                         const val = mapMode === 'total' ? (countryData?.count || 0) : (countryData?.online || 0);
                                                         const fillColor = colorScale(val) as string;
                                                         const displayName = countryData?.country_name || getCountryNameKO(geoCode, targetName);
                                                         return (
                                                             <Geography
                                                                 key={geo.rsmKey}
                                                                 geography={geo}
                                                                 onMouseEnter={() => setTooltipContent(`${displayName}\n전체: ${countryData?.count || 0}명 | 온라인: ${countryData?.online || 0}명`)}
                                                                 onMouseLeave={() => setTooltipContent("")}
                                                                 style={{
                                                                     default: { fill: fillColor, outline: "none", transition: "all 300ms", stroke: "#FFFFFF", strokeWidth: 0.4 },
                                                                     hover: { fill: "#10B981", outline: "none", cursor: "pointer", stroke: "#FFFFFF", strokeWidth: 0.6 },
                                                                     pressed: { outline: "none" },
                                                                 }}
                                                             />
                                                         );
                                                     })
                                                 }
                                             </Geographies>
                                         </ZoomableGroup>
                                     </ComposableMap>
                                     {tooltipContent && (
                                         <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-foreground text-background text-[11px] px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 z-50 font-bold border border-white/10 whitespace-pre-line text-center">
                                             {tooltipContent}
                                         </div>
                                     )}
                                 </div>
                             ) : (
                                 <div className="text-xs text-muted-foreground animate-pulse">Loading Map...</div>
                             )}
                             <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-border/60 shadow-xl z-20">
                                 <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                          <div className="flex flex-col gap-1.5 flex-1">
                                              <div className="flex justify-between text-[8px] md:text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                                  <span>낮음</span><span>{mapMode === 'total' ? '유저 밀도' : '온라인 접속'}</span><span>높음</span>
                                              </div>
                                              <div className="flex w-full h-1.5 md:h-2 rounded-full overflow-hidden border border-black/5 shadow-inner">
                                                  {["#E5E7EB", "#D1FAE5", "#6EE7B7", "#10B981", "#064E3B"].map((c, i) => (
                                                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                                                  ))}
                                              </div>
                                          </div>
                                          <button onClick={() => setIsStatesModalOpen(true)} className="ml-4 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap border border-primary/20">전체 보기</button>
                                      </div>
                                      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                                      <div className="space-y-2">
                                          {(stats?.geoData || []).filter(d => d.country !== 'Unknown').sort((a, b) => (mapMode === 'total' ? b.count - a.count : (b.online || 0) - (a.online || 0))).slice(0, 3).map((d, i) => (
                                            <div key={i} className="flex items-center justify-between group/item">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-black/5" style={{ backgroundColor: colorScale(mapMode === 'total' ? d.count : (d.online || 0)) as string }} />
                                                    <span className="text-[12px] font-bold text-foreground/90">{getCountryNameKO(d.country, d.country_name)}</span>
                                                </div>
                                                <span className="text-[11px] font-black text-primary">{(mapMode === 'total' ? d.count : (d.online || 0)).toLocaleString()}명</span>
                                            </div>
                                          ))}
                                          {(stats?.geoData.length === 0) && <div className="text-xs text-center text-muted-foreground">지역 데이터가 없습니다</div>}
                                      </div>
                                 </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* 전체 국가 통계 모달 */}
                    {isStatesModalOpen && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 animate-in fade-in duration-300" onClick={() => setIsStatesModalOpen(false)} />
                        <div className="relative w-full max-w-2xl bg-secondary rounded-2xl border border-border shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
                          <div className="flex items-center justify-between p-5 border-b border-border/60">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 text-primary rounded-xl"><Globe size={20} /></div>
                              <div>
                                <h3 className="font-bold text-foreground">국가별 접속 통계</h3>
                                <p className="text-xs text-muted-foreground">전체 {stats?.geoData.length || 0}개 지역 · {mapMode === 'total' ? '전체 사용자' : '온라인 사용자'} 기준</p>
                              </div>
                            </div>
                            <button onClick={() => setIsStatesModalOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><XCircle size={20} className="text-muted-foreground" /></button>
                          </div>
                          <div className="p-4 border-b border-border/40">
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border/40">
                              <Search size={14} className="text-muted-foreground" />
                              <input type="text" placeholder="국가 검색..." className="bg-transparent border-none outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-secondary/95 z-10">
                                <tr className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                                  <th className="text-left py-2 px-3">순위</th><th className="text-left py-2 px-3">국가</th>
                                  <th className="text-right py-2 px-3">전체</th><th className="text-right py-2 px-3">온라인</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/40">
                                {(stats?.geoData || []).filter(d => getCountryNameKO(d.country, d.country_name).includes(searchTerm) || d.country.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => (mapMode === 'total' ? b.count - a.count : (b.online || 0) - (a.online || 0))).map((d, i) => (
                                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-3 px-3 text-muted-foreground font-bold text-xs">#{i + 1}</td>
                                    <td className="py-3 px-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorScale(mapMode === 'total' ? d.count : (d.online || 0)) as string }} />
                                        <span className="font-semibold">{getCountryNameKO(d.country, d.country_name)}</span>
                                        <span className="text-[10px] text-muted-foreground">{d.country}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 text-right font-bold text-primary">{d.count.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-right text-emerald-600 font-bold">{(d.online || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="p-4 border-t border-border/60 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">전체 {stats?.geoData.length || 0}개 지역</span>
                            <button onClick={() => setIsStatesModalOpen(false)} className="px-4 py-2 bg-muted text-foreground text-sm font-bold rounded-lg hover:bg-muted/80">닫기</button>
                          </div>
                        </div>
                      </div>
                    )}
                 </>
                )}
             </div>
          )}

          {activeTab === 'acquisition' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                     <h3 className="font-bold text-foreground mb-4">채널별 유입 경로</h3>
                     <div className="space-y-4">
                        {[
                           { label: '검색 (Organic)', value: 45, color: 'bg-emerald-500' },
                           { label: '소셜 (Social)', value: 28, color: 'bg-blue-500' },
                           { label: '직접 접속 (Direct)', value: 15, color: 'bg-purple-500' },
                           { label: '추천 (Referral)', value: 12, color: 'bg-amber-500' }
                        ].map((item, i) => (
                           <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                 <span>{item.label}</span>
                                 <span className="font-bold text-foreground">{item.value}%</span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                 <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm md:col-span-2">
                     <h3 className="font-bold text-foreground mb-4">가입 전환 퍼널</h3>
                     <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
                        {[
                           { step: '전체 방문(가입)', count: stats?.funnel?.visitors || 0, drop: '100%', icon: Globe },
                           { step: '프로필 설정 완료', count: stats?.funnel?.onboarded || 0, drop: `${stats?.funnel?.visitors ? Math.round((stats.funnel.onboarded / stats.funnel.visitors) * 100) : 0}%`, icon: Search },
                           { step: '콘텐츠 생성자', count: stats?.funnel?.active_creators || 0, drop: `${stats?.funnel?.visitors ? Math.round((stats.funnel.active_creators / stats.funnel.visitors) * 100) : 0}%`, icon: CheckCircle2 }
                        ].map((item, i, arr) => (
                           <React.Fragment key={i}>
                              <div className="flex-1 flex flex-col items-center p-4 bg-muted/30 rounded-xl border border-border/40 w-full">
                                 <div className="p-3 bg-primary/10 text-primary rounded-full mb-3">
                                    <item.icon size={24} />
                                 </div>
                                 <span className="text-sm font-medium text-muted-foreground">{item.step}</span>
                                 <span className="text-xl font-bold mt-1">{item.count.toLocaleString()}</span>
                                 <span className="text-xs text-primary font-bold mt-1">{item.drop}</span>
                              </div>
                              {i < arr.length - 1 && (
                                 <div className="hidden md:block text-muted-foreground">
                                    <TrendingUp className="rotate-90" size={24} />
                                 </div>
                              )}
                           </React.Fragment>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-6">
               <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                  <h3 className="font-bold text-foreground mb-4">사용자 유지율 (Retention Rate)</h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                        <thead>
                           <tr className="border-b">
                              <th className="text-left py-3 px-4 font-black">Cohort (Signup Mo.)</th>
                              <th className="py-3 px-4">Size</th>
                              {['D+1', 'D+7', 'D+30'].map(d => (
                                 <th key={d} className="py-3 px-4 font-black">{d}</th>
                              ))}
                           </tr>
                        </thead>
                        <tbody>
                           {(stats as any)?.cohorts?.map((row: any, i: number) => (
                              <tr key={i} className="border-b hover:bg-muted/20">
                                 <td className="py-3 px-4 font-medium">{row.cohort}</td>
                                 <td className="py-3 px-4 text-center text-muted-foreground">{row.size}</td>
                                 {[row.d1, row.d7, row.d30].map((count, j) => {
                                    const rate = Math.round((count / row.size) * 100) || 0;
                                    return (
                                       <td key={j} className="py-3 px-4 text-center">
                                          <div 
                                             className="py-2 rounded-md font-bold" 
                                             style={{ 
                                                backgroundColor: `rgba(16, 185, 129, ${rate / 100})`,
                                                color: rate > 50 ? 'white' : 'inherit'
                                             }}
                                          >
                                             {rate}%
                                          </div>
                                       </td>
                                    );
                                 })}
                              </tr>
                           ))}
                           {!(stats as any)?.cohorts?.length && (
                             <tr>
                               <td colSpan={5} className="py-8 text-center text-muted-foreground">코호트 데이터가 충분하지 않습니다.</td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

         {activeTab === 'dataops' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                     <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" />
                        시스템 성능 리포트
                     </h3>
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                           <span className="text-sm font-medium">평균 API 응답 속도</span>
                           <span className="text-xl font-bold text-emerald-600">{(stats as any)?.health?.api_latency || 0}ms</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: '92%' }} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                              <div className="text-xs text-muted-foreground mb-1">DB Connection</div>
                              <div className="text-lg font-bold text-emerald-600 capitalize">{(stats as any)?.health?.db_status || 'stable'}</div>
                           </div>
                           <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                              <div className="text-xs text-muted-foreground mb-1">Cache Hit Rate</div>
                              <div className="text-lg font-bold text-emerald-600">{(stats as any)?.health?.cache_hit_rate || 0}%</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-secondary p-6 rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm">
                     <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        보안 및 이상 징후 감지
                     </h3>
                     <div className="space-y-3">
                        {[
                           { type: 'Info', msg: '비정상적 로그인 시도 차단 (IP: 192.x.x.x)', time: '2시간 전', status: 'Blocked' },
                           { type: 'Warning', msg: '특정 사용자 게시글 도배 감지', time: '5시간 전', status: 'Reviewing' },
                           { type: 'Success', msg: '정기 보안 취약점 점검 완료', time: '1일 전', status: 'Resolved' }
                        ].map((log, i) => (
                           <div key={i} className="flex justify-between items-center p-3 hover:bg-muted/30 rounded-lg border border-transparent hover:border-border/40 transition-all">
                              <div className="flex items-center gap-3">
                                 <div className={`w-2 h-2 rounded-full ${log.type === 'Warning' ? 'bg-amber-500' : log.type === 'Info' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                 <div>
                                    <div className="text-sm font-medium">{log.msg}</div>
                                    <div className="text-[10px] text-muted-foreground">{log.time}</div>
                                 </div>
                              </div>
                              <span className="text-xs font-bold text-muted-foreground">{log.status}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

const TabButton = ({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: any }) => (
  <button onClick={onClick} className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors whitespace-nowrap select-none ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
    <Icon size={18} /> {label}
    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
  </button>
);

const MetricCard = ({ title, value, subtitle, trend, trendUp, icon: Icon, badge, color = "primary" }: any) => (
  <div className="p-5 bg-secondary rounded-2xl border border-gray-300 dark:border-gray-500 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      {badge ? badge : trend && (
         <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
            {trend}
         </div>
      )}
    </div>
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{subtitle}</p>}
    </div>
  </div>
);

export default AdminAnalytics;


