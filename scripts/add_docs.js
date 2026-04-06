const fs = require('fs');
const path = require('path');

// Base directories to scan
const dirsToScan = [
  'src/pages/admin',
  'src/pages/analytics',
  'src/pages/notifications',
  'src/pages/profile',
  'src/hooks',
  'src/services',
  'src/contexts',
  'src/utils'
];

// Mapping of file names/paths to their Why/How descriptions
const descriptions = {
  // src/pages/admin
  'AdminAnalytics.tsx': ['관리자 분석 대시보드(Admin Analytics Dashboard)', '서비스 전반의 사용자 트래픽, 국가별 분포 및 주요 지표를 시각화하여 데이터 기반 의사결정을 지원함', 'Supabase 통계 데이터를 Recharts로 시각화하고 기간별 필터링을 제공함'],
  'AdminAuthCallback.tsx': ['관리자 인증 콜백 처리기(Admin Auth Callback Handler)', '최고 관리자 또는 스태프의 OAuth/Magic 링크 로그인을 안전하게 확인하고 대시보드로 인도함', 'URL 토큰 파싱 후 Supabase 세션을 수립하고 권한 검증 라우트로 리다이렉트함'],
  'AdminBannerManager.tsx': ['서비스 메인 배너 관리 체계(Service Main Banner Management System)', '홈페이지, 스토어 등 주요 고객 접점의 마케팅 배너를 실시간으로 제어하고 순서를 관리함', 'Drag & Drop 기반의 배열 정렬 기능과 이미지 업로드, 상태 토글 UI를 제공함'],
  'AdminContentModeration.tsx': ['운영자 커뮤니티 콘텐츠 검수 툴(Admin Content Moderation Tool)', '부적절한 게시글 및 이미지를 격리 조치하여 건강한 커뮤니티 생태계를 유지함', '사용자 신고 누적 데이터와 필터링 결과를 바탕으로 게시물 숨김 및 삭제 처리를 수행함'],
  'AdminGoodsManagement.tsx': ['공식 굿즈 재고 및 라인업 관리 콘솔(Official Goods Inventory & Lineup Console)', '실물 상품의 판매 상태(New, Best, Sold Out)와 할인율, 가격 등을 통합적으로 운영함', '상품 테이블 CRUD 쿼리 연동과 함께 뱃지 토글, 일괄 수정 기능을 지원함'],
  'AdminGoodsUpload.tsx': ['신규 굿즈 데이터 등록 엔진(New Goods Data Registration Engine)', '새로운 상품의 이미지, 상세 설명, 가격 정보를 시스템에 안정적으로 등재함', 'Supabase Storage 멀티파트 업로드 및 폼 검증(Form Validation)을 통한 무결성 보장을 수행함'],
  'AdminHome.tsx': ['관리자 대시보드 홈 뷰(Admin Dashboard Home View)', '시스템 전체의 요약 상태, 최근 알림, 단축 메뉴 등 통합 운영 현황 브리핑을 제공함', '권한 기반 데이터 조회 및 요약 위젯 렌더링으로 페이지 진입 시 직관적인 정보를 요약함'],
  'AdminLayout.tsx': ['어드민 전용 레이아웃 셸(Admin Dedicated Layout Shell)', '관리자의 복잡한 메뉴 이동을 지원하기 위해 사이드 네비게이션 및 헤더 구조를 표준화함', '중첩 라우트(Outlet)와 상태 기반의 토글식 LNB(Local Navigation Bar)를 적용함'],
  'AdminLogin.tsx': ['관리자 인트라넷 출입 통제소(Admin Intranet Access Control)', '비인가자의 운영 시스템 접근을 차단하기 위한 전용, 고보안 로그인 화면을 제공함', '관리자 테이블 권한 교차 검증과 MFA(선택)를 포괄하는 보안 로그인 프레임워크를 연동함'],
  'AdminPromotionsPage.tsx': ['프로모션 할인 쿠폰 허브(Promotional Discount Coupon Hub)', '유저들의 결제 전환율을 높이기 위한 프로모션 쿠폰을 발급하고 사용 현황을 추적함', '쿠폰 코드 난수 생성기 및 발급/소진 상태 관리를 위한 데이터베이스 릴레이션 매핑을 수행함'],
  'AdminReports.tsx': ['악성 유저 신고 및 제재 처분 센터(Malicious User Report & Sanction Center)', '불량 이용자의 위반 사례를 검토하고, 사이트 접근 차단(Ban) 등의 후속 조치를 결단함', '유저별 누적 신고 스코어 산출 및 제재 로그(Sanction History) 삽입 트랜잭션을 실행함'],
  'AdminSettings.tsx': ['시스템 환경 변수 오케스트레이터(System Environment Variables Orchestrator)', '글로벌 공지사항, 유지보수 모드 토글 등 플랫폼의 전역 상태를 동적으로 제어함', '설정 테이블(Settings/Config) 업데이트 및 실시간 클라이언트 브로드캐스팅을 지원함'],
  'AdminStudyManagement.tsx': ['어학 훈련 코스 커리큘럼 매니저(Language Training Course Curriculum Manager)', '사용자가 학습하게 될 동영상 및 텍스트 커리큘럼의 메타데이터를 전반적으로 제어함', 'K-Pop/K-Drama 분류별 콘텐츠 CRUD 및 챕터별 트리 구조를 동적으로 렌더링함'],
  'AdminStudyUpload.tsx': ['프리미엄 학습 리소스 업로드 툴(Premium Learning Resource Upload Tool)', '고품질 영상 및 자막 파일, 단어장 데이터를 학습 시스템 클라우드에 안정적으로 업로드함', '대용량 미디어 파일 처리를 돕는 청크 스트리밍, 트랜스코딩 트리거 로직을 추상화함'],
  'UserManagement.tsx': ['전체 가입자 데이터베이스 브라우저(Global Subscriber Database Browser)', '개별 유저의 구독 플랜, 로그인 이력, 접속 상태를 실시간으로 탐색하고 강제 제어함', '페이지네이션 데이터 패칭, 사용자 강제 로그아웃 조치, 권한 승급/강등(Role Manage) 로직을 구사함'],

  // hooks
  'use-mobile.tsx': ['반응형 모바일 뷰포트 감지 훅(Responsive Mobile Viewport Detection Hook)', '클라이언트의 화면 너비를 실시간으로 평가하여 모바일 최적화 레이아웃 분기를 지원함', 'MatchMedia API 및 리사이즈 이벤트 리스너를 결합하여 미디어 쿼리 상태를 동기화함'],
  'useAuth.js': ['레거시 인증 상태 참조 훅(Legacy Auth State Reference Hook)', '이전 버전의 컴포넌트 환경에서 세션 및 사용자 프로필 데이터에 접근성을 부여함', 'Context API를 통한 전역 상태 공유 및 옵저버 패턴 기반의 상태 업데이트를 매핑함'],
  'useAutoTranslation.ts': ['인페이지 실시간 텍스트 번역기(In-page Real-time Text Translator Hook)', '포스트, 댓글 등의 다국어 콘텐츠를 사용자의 설정 언어로 즉시 번역하여 표시함', 'DeepL API 또는 통합 번역기 계층과 통신하여 언어 코드를 변환하고 캐시 메모레이션을 수행함'],
  'useBatchAutoTranslation.ts': ['대용량 배열 컨텐츠 일괄 번역 훅(Batch Auto-Translation Hook)', '피드처럼 다수의 게시글이 렌더링될 때 트랜잭션 과부하를 막기 위해 일괄 번역을 수행함', 'Promise.all 및 디바운스 대기열을 통한 비동기 번역 최적화 파이프라인을 구축함'],
  'useBlock.ts': ['사용자 차단 릴레이션 매니저(User Blocking Relation Manager Hook)', '위협적이거나 원치 않는 사용자와의 상호작용을 차단하여 개인화된 안전 구역을 형성함', '차단 테이블(Blocks) 뮤테이션 및 Query Invalidation을 통한 낙관적 UI 업데이트를 실행함'],
  'useBlockedUsers.ts': ['차단된 사용자 상태 동기화퍼(Blocked Users State Synchronizer)', '앱 전역에 걸쳐 자신이 차단한 유저 리스트를 메모리 상에 캐싱하여 빠른 필터링을 돕음', '초기 로딩 시 목록을 Fetching 하고, 이벤트 에미터를 통해 타 컴포넌트와의 동기화를 보장함'],
  'useBodyScrollLock.ts': ['바디 스크롤 차단 및 프리징 제어기(Body Scroll Lock & Freezing Controller)', '모달이나 오버레이가 활성화되었을 때 백그라운드 페이지의 원치 않는 스크롤 움직임을 억제함', 'Document.body의 overflow 속성을 조작하고 스크롤바 너비를 보정하여 레이아웃 시프트를 방지함'],
  'useFollow.ts': ['소셜 팔로우 네트워크 제어 훅(Social Follow Network Control Hook)', '타 사용자 구독 및 구독 해제 액션을 처리하여 커뮤니티 연결망을 구성함', '소셜 그래프 통계 증감 수치를 선반영(Optimistic Update) 처리하고 롤백 프로시저를 동반함'],
  'useInfiniteScroll.ts': ['고성능 멀티-뷰포트 무한 연쇄 로더(High-performance Multi-viewport Infinite Scroll)', '대용량 데이터 세트의 페이징 부하를 분산시키고 자연스러운 브라우징 경험을 연속적으로 제공함', 'Intersection Observer API를 활용한 엘리먼트 가시성 트래킹과 쓰로틀링(Throttling)을 조합함'],
  'useLike.ts': ['게시글 공감 교류 상태 관리기(Post Engagement State Manager Hook)', '하트(좋아요) 액션을 통한 인터랙션 활성화를 지원하고 실시간 숫자를 갱신함', 'Debounce 토글 로직과 함께 로컬 State 선반영 후 Supabase RPC 프로시저를 실행시킴'],
  'useMarketingBanners.ts': ['마케팅 캠페인 배너 조달자(Marketing Campaign Banner Procurer)', '홈, 상점 등 각 페이지 영역별 활성화된 프로모션 배너를 적재적소에 로드함', '활성 기간(Start/End) 필터링 및 클릭/조회 트래킹 이벤트를 로그 기록(Analytics)에 연동함'],
  'useNicknameValidator.ts': ['사용자 닉네임 구문 및 중복 평가기(User Nickname Syntax & Duplication Validator)', '회원가입 및 프로필 편집 시 안전하고 중복 없는 사용 가능한 닉네임을 사전 검열함', '정규표현식을 활용한 로컬 검사 후, DB Index 조회를 통한 원격 충돌(Conflict) 분석을 병행함'],
  'useRelinkDetection.tsx': ['고아 소셜 계정 재병합 어시스턴트(Orphan Social Account Relink Assistant)', '이전에 해제된 소셜 계정을 안전하게 메인 계정으로 다시 결합하거나 블로킹함', 'Auth Identity 테이블과 메타데이터 간의 무결성을 조회하여 충돌 프로필의 소유권을 검증함'],
  'useRetweet.ts': ['리포스트/리트윗 전파 제어 훅(Repost/Retweet Propagation Control Hook)', '타인의 게시물을 자신의 피드에 복사/전파하여 바이럴 콘텐츠의 확산을 지원함', '관계형 테이블 기반의 피드 주입 알고리즘(SQL) 호출 및 클라이언트의 토글 상태를 매핑함'],
  'useSignupKind.ts': ['인증 유형 식별 라우터 상태(Authentication Type Identification Router State)', '사용자의 진입점 플로우(이메일 가입 vs 소셜 가입)를 구분하여 맞춤형 스텝퍼를 통제함', 'React Router Location State 및 검색 파라미터(Search Params)를 추출하여 의존성 주입함'],
  'useSignupStepper.ts': ['회원가입 절차(마법사) 상태 전이 머신(Signup Wizard State Transition Machine)', '복잡한 다단계 입력 폼을 체계적으로 분해하고 유효성 로직의 방어선(Guard)을 구축함', 'Form Context 및 커스텀 가드(Guard) 함수 패턴을 기반으로 단계(Step) 간 이동을 격리시킴'],
  'useSnsLoginGate.ts': ['SNS 게이트웨이 인증 권한 제어기(SNS Gateway Authentication Controller)', '소셜 활동(쓰기/좋아요 등) 전 로그인 필요 여부를 판단하고 매끄러운 진입을 유도함', '조건부 인터셉트(Intercept) 방식을 통해 미인증 시 모달을 띄우고 이전 동작 스택을 복원함'],
  'useStudy.js': ['학습 코스 수강 진행 매니저(Learning Course Progress Manager Hook)', '사용자의 현재 어학 학습 진도(Progress) 추적 및 세션 보존을 담당함', 'Local Storage 동기화 및 학습 테이블(Study Enroll)의 State 캐싱을 백그라운드에서 조절함'],
  'useUserTracker.ts': ['사용자 행동 정보 트래킹 수집기(User Behavior Analytics Tracking Collector)', '페이지 진입점, 세션 지속 시간 등의 유저 인터랙션을 수집하여 마케팅 퍼널을 고도화함', '마운트/언마운트 생명주기를 감청하여 커스텀 이벤트 로거(Event Logger)를 Data Layer에 푸시함'],

  // services
  'PaymentService.ts': ['외부 결제 브릿지 계층 매니저(External Payment Bridge Layer Manager)', 'Stripe, Toss 등 외부 결제 PG사와의 트랜잭션 수립 및 검증 시퀀스를 보안화함', '결제 인텐트(Intent) 발급 리퀘스트 및 웹훅(Webhook) 결과 연동 구조를 추상적인 메서드로 매핑함'],
  'authService.ts': ['코어 사용자 자격증명 브로커(Core Verification & Credentials Broker)', 'Supabase Auth 객체와의 직접적인 교신을 통해 보안성이 생명인 인증 플로우를 총괄함', '회원가입, 로그인 통신 및 세션 갱신/초기화 프로토콜을 API 파사드(Facade) 형식으로 추상화함'],
  'consentService.ts': ['법적 동의 조약 기록 아카이브(Legal Consent Treaty Record Archive)', '제3자 정보 제공, 약관 및 정책의 버전 관리와 이용자 동의 변경 이력을 타임스탬프화함', 'Consent 관련 로우(Row) 데이터를 Upsert 처리하여 컴플라이언스(Compliance) 감사에 대응함'],
  'goodsService.ts': ['디지털 스토어 인벤토리 미들웨어(Digital Store Inventory Middleware)', '굿즈 상품 리스팅, 필터링 쿼리 요청 및 장바구니 픽스처(주문서) 전송을 위임함', 'Restful Fetch 함수 단위로 도메인을 분리하고, 에러 핸들링과 DTO 타입 선언 형식을 강제함'],
  'tweetService.ts': ['글로벌 소셜 피드 송수신 네트워크(Global Social Feed Network Transceiver)', '게시물 작성, 미디어 파편화 업로드, 타임라인 생성과 관련된 Data 레이어를 관장함', 'RPC 페이징 호출 및 Storage API 업로드를 통합한 컴포짓 트랜잭션 함수를 내보냄'],

  // contexts
  'AuthContext.tsx': ['전역 어플리케이션 인증 콘텍스트(Global Application Authorization Context)', '로그인 한 유저의 세션 및 프로필 메타데이터를 시스템 전반에 주입하여 라이프사이클을 지배함', 'React Context API와 Supabase onAuthStateChange 이벤트를 결합한 싱글톤 프로바이더 구조를 설계함'],
  'DirectChatContext.tsx': ['1:1 다이렉트 메시징 브로드캐스터(1:1 Direct Messaging Broadcaster Context)', '개인 간 실시간 메시지 송수신, 읽음 처리, 채팅방 입장/퇴장 스택을 전역적으로 관리함', 'Realtime Channel 구독과 Zustand-like의 Reducer 상태 트리를 연동하여 통신 딜레이를 해소함'],
  'NewChatNotificationContext.tsx': ['신규 채팅 알림 버스(New Chat Notification Event Bus)', '전체 화면 어디에 있든 새로 수신된 메시지의 푸시 인디케이터 바인딩을 가능케 함', '메시지 Insert 이벤트를 리스닝하여 Unread Count와 연결된 헤더/마이페이지 뱃지를 자동 토글함'],
  'PresenceContext.tsx': ['유저 실시간 접속 상태 레이더(User Real-time Presence Radar Context)', '나와 친구를 맺은 사용자의 온라인/오프라인 상태 및 최근 활동 추적 결과를 방사선처럼 공유함', 'Supabase Presence Sync 기능을 채택하여 WebSocket 풀 내의 커넥션 메타데이터를 유지 및 분배함'],
  'SiteSettingsContext.tsx': ['오퍼레이션 글로벌 속성 레지스트리(Operation Global Attributes Registry)', '운영 모드(보수 중), 서비스 슬로건, 글로벌 디자인 테마 등 사이트 전체의 정적/동적 설정값을 캐싱함', '환경 테이블을 최초 부팅 시 마운트(Prefetch)하여 클라이언트에 블로킹 없는 정적 데이터 주입을 지원함'],

  // utils
  'banUtils.ts': ['규제 및 차단 수식 판별기(Regulation & Ban Formula Discriminator)', '특정 계정의 악성 행위에 따른 차단 시간 경과율 검사 및 폼 포맷팅(포맷변환)을 전담함', 'Date 수학 처리 객체를 활용하여 영구 정지(Permanent) 여부와 잔여 패널티 시간 등을 문자열화함'],
  'dateUtils.ts': ['타임존 최적화 일자 포매터(Timezone-optimized Date Formatter)', 'ISO 형식의 문자열을 인간이 인지할 수 있는 X분 전 / 오늘 / 년월일 형식으로 컨버팅함', 'Date-fns 라이브러리를 확장하여 Locale(i18n) 설정과 상대적 시간(Relative Time) 처리 로직을 가미함'],
  'emailUtils.ts': ['개인정보 비식별 마스킹 유틸(Privacy De-identification Masking Util)', '이메일 계정 노출 시 보안을 위해 앞/뒤 서명 부분 일부를 (*) 애스터리스크 문자열로 필터링함', '정규표현식 매칭 및 Substring 조각화를 사용하여 이메일 고유 명사의 구조 무결성을 해치지 않게 보호함'],
  'getTitle.ts': ['페이지별 동적 타이틀 추출기(Dynamic Page Title Extractor)', 'SPA(Single Page App) 구조 안에서 라우팅 변경에 의해 갱신되어야 할 브라우저 탭 타이틀을 연산함', '경로(Pathname) 맵핑 객체 또는 메타 컴포넌트에 공급할 String 리터럴을 스위칭(Switch) 반환함'],
  'image.ts': ['이미지 리소스 해상도 보정기(Image Resource Resolution Calibrator)', '업로드할 이미지 원본 비율 유지, 용량 압축 및 브라우저 호환성을 위한 확장자 컨버팅 파사드 패턴', 'HTML Canvas API를 내부적으로 생성, drawImage 처리 후 WebP/JPEG 퀄리티율 기반 병렬 처리를 위임함'],
  'motion.ts': ['Framer 컴포지션 상수 팩토리(Framer Composition Constant Factory)', '앱 전반에 걸쳐 쓰일 부드럽고 일괄적인 모달 트랜지션 및 뷰 애니메이션의 스프링/타이밍 상수를 세팅함', 'Variants 객체 사전 정의(Variants Definition)를 통한 컴포넌트 선언부 복잡도를 해소 및 재사용성을 향상함'],
  'networkUtils.ts': ['인터페이스 네트워크 핑 테스터(Interface Network Ping Tester)', '현재 클라이언트 디바이스 네트워크 상태 파악 및 Fetch 타임아웃 예외 상황에 대한 안전 백업 래퍼', 'navigator.onLine 플래그 연계 및 Retry 알고리즘을 덧붙인 비동기 HTTP 에러 캐치 프로시저를 통합함'],
  'profileImage.ts': ['범용 프로필 이미지 폴백 매니저(Universal Profile Image Fallback Manager)', '유저의 아바타 URL이 손상되었거나 누락된 상태일 때 브로큰 이미지를 방어할 기본 프록시 도메인을 반환함', 'URL 유효성 정규식 및 Try/Catch 핸들링 후 정적 로컬 어셋(/images) 경로 스트링을 출력(Render)함'],
  'recovery.ts': ['계정 복구 암호화 파이프라인(Account Recovery Encryption Pipeline)', '비밀번호를 분실했을 때 본인 인증을 통한 해시(Hash) 비교 및 복구 시크릿 검증을 실시하여 신원을 보장함', '해시 함수 또는 서명(Signature) 대조 구문을 캡슐화 방식으로 서포트하여 불법적 공격 벡터를 원천 봉쇄함'],
  'safety.ts': ['클라이언트 XSS 방어 새니타이저(Client XSS Defense Sanitizer)', '사용자 입력값에 포함된 악용 가능 스크립트(태그)나 SQL 징후 텍스트를 파싱 전 안전한 코드로 정제함', 'DOMParser 혹은 정규식(Regex) Replacer 파이프를 통해 이스케이프 매칭 로직을 강제 수행함'],
  'storage.ts': ['로컬/세션 캐시 스토리지 어댑터(Local/Session Cache Storage Adapter)', '브라우저 규격의 스토리지 입출력 시 발생 가능한 Quota 에러, 파싱(JSON) 스크립트 충돌을 미연에 방어함', 'Window Storage 인터페이스를 래핑한 Safe Getter/Setter 로직 및 만료 시간(TTL) 개념을 주입하여 가비지 컬렉팅함']
};

const defaultDocTemplate = (name) => \`/**
 * \${name} 처리 컴포넌트/모듈(\${name} Module):
 * - 목적(Why): \${name} 관련 비즈니스 로직 및 렌더링 파이프라인을 캡슐화하여 유지보수성을 확보함
 * - 방법(How): 아키텍처 컨벤션에 의거하여 독립적인 상태 관리 및 유틸리티 패턴을 구현함
 */\`;

let updatedCount = 0;

function processDirectory(dirPath) {
  // get absolute path
  const absPath = path.resolve(process.cwd(), dirPath);
  if (!fs.existsSync(absPath)) return;
  
  const files = fs.readdirSync(absPath);
  
  for (const file of files) {
    const fullPath = path.join(absPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(path.join(dirPath, file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if it already has a doc block
      if (!content.trimStart().startsWith('/**')) {
        let docText = '';
        if (descriptions[file]) {
           const [title, why, how] = descriptions[file];
           docText = \`/**
 * \${title}:
 * - 목적(Why): \${why}
 * - 방법(How): \${how}
 */\`;
        } else {
           docText = defaultDocTemplate(file);
        }
        
        content = docText + '\\n' + content;
        fs.writeFileSync(fullPath, content, 'utf8');
        updatedCount++;
        console.log(\`Updated \${file}\`);
      }
    }
  }
}

for (const dir of dirsToScan) {
  processDirectory(dir);
}

console.log(\`Total files updated: \${updatedCount}\`);
