import { 
  Bell, 
  Lock, 
  Globe, 
  Database,
  Shield,
  Save,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone,
  AlertTriangle,
  Layout
} from 'lucide-react';
import React, { useState } from 'react';

// Design: Sidebar specific to settings page (tabs)
const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: '일반 설정', icon: Globe },
    { id: 'security', label: '보안 및 접근', icon: Shield },
    { id: 'notifications', label: '알림 설정', icon: Bell },
    { id: 'system', label: '시스템 관리', icon: Database },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">관리자 설정</h1>
        <p className="text-muted-foreground mt-1">사이트 운영 환경 및 시스템 설정을 관리합니다.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav (Tabs) */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-secondary rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm p-2 sticky top-24">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary/10 dark:bg-primary-900/30 text-primary shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionCard title="서비스 운영 상태" description="현재 서비스의 대외적 운영 상태를 정의합니다.">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">서비스 상태</label>
                    <div className="grid grid-cols-3 gap-3">
                      <StatusOption label="정상 운영" color="emerald" selected />
                      <StatusOption label="점검 중" color="amber" />
                      <StatusOption label="접속 제한" color="red" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">서비스 명칭</label>
                    <input type="text" defaultValue="Project Ara" className="form-input w-full md:w-1/2 bg-background border-gray-300 dark:border-gray-500 text-foreground" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="글로벌 공지사항" description="모든 페이지 상단에 노출되는 긴급 공지바를 설정합니다.">
                 <div className="space-y-3">
                    <ToggleRow label="공지바 활성화" description="사이트 최상단에 공지 내용을 표시합니다." />
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">공지 내용</label>
                      <input type="text" placeholder="예: 서버 점검 예정 안내 (02:00 ~ 04:00)" className="form-input w-full bg-background border-gray-300 dark:border-gray-500 text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground" />
                    </div>
                 </div>
              </SectionCard>
            </div>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <SectionCard title="접근 제어 및 보안" description="서비스 접근 권한 및 보안 레벨을 설정합니다.">
                  <div className="space-y-4">
                     <ToggleRow label="관리자 페이지 접속 IP 제한" description="허용된 IP 대역에서만 관리자 페이지 접속을 허용합니다." checked />
                     <ToggleRow label="다중 로그인 제한" description="한 계정으로 동시 접속할 수 있는 기기 수를 1개로 제한합니다." />
                     <ToggleRow label="브루트 포스 방지" description="5회 이상 로그인 실패 시 해당 IP를 일시 차단합니다." checked />
                  </div>
               </SectionCard>

               <SectionCard title="인증 정책" description="사용자 인증 방식 및 세션 정책을 관리합니다.">
                  <div className="space-y-4">
                     <ToggleRow label="2단계 인증(2FA) 필수 적용" description="관리자 등급 이상은 2FA를 필수로 사용해야 합니다." />
                     <div className="pt-4 border-t border-gray-300 dark:border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-medium text-foreground mb-1">비밀번호 만료 기간</label>
                           <select className="form-select w-full">
                              <option>90일</option>
                              <option>180일</option>
                              <option>제한 없음</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-foreground mb-1">세션 타임아웃</label>
                           <div className="flex items-center gap-2">
                             <input type="number" defaultValue="60" className="form-input w-full" />
                             <span className="text-sm text-muted-foreground whitespace-nowrap">분</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </SectionCard>
            </div>
          )}

           {/* Notifications Settings Tab */}
           {activeTab === 'notifications' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <SectionCard title="관리자 이메일 알림" description="관리자 업무와 관련된 이메일 수신을 설정합니다.">
                   <div className="space-y-4">
                     <ToggleRow label="일일 운영 리포트" description="매일 아침 전일의 사용자 가입, 트래픽 등의 요약 리포트를 받습니다." checked />
                     <ToggleRow label="관리자 계정 보안 알림" description="관리자 계정으로 새로운 환경에서 로그인 시도 시 이메일을 발송합니다." checked />
                     <ToggleRow label="서버 리소스 경고" description="CPU/메모리 사용량이 임계치를 초과하면 이메일로 경고를 보냅니다." />
                   </div>
                </SectionCard>
                <SectionCard title="관리자 알림 기본 설정" description="관리자에게 발송되는 주요 중요 알림을 설정합니다.">
                   <div className="space-y-4">
                     <ToggleRow label="신규 신고 접수 알림" description="새로운 사용자 신고나 글 신고가 접수되면 즉시 알림을 받습니다." checked />
                     <ToggleRow label="1:1 문의/채팅 알림" description="사용자의 1:1 문의 채팅이 도착하면 알림을 받습니다." checked />
                     <ToggleRow label="비정상 활동 감지" description="비정상적인 트래픽이나 다수의 로그인 실패 등이 감지되면 알립니다." checked />
                     <ToggleRow label="주요 시스템 오류" description="서버 장애나 치명적인 오류 발생 시 긴급 알림을 전송합니다." checked />
                   </div>
                </SectionCard>
             </div>
           )}

           {/* System Settings Tab */}
           {activeTab === 'system' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                   <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                   <div>
                     <h4 className="font-semibold text-amber-900">유지보수 모드</h4>
                     <p className="text-sm text-amber-700 mt-1">활성화 시 관리자를 제외한 모든 사용자의 접속이 제한됩니다.</p>
                     <div className="mt-3">
                        <button className="px-4 py-2 bg-secondary border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors">
                          유지보수 모드 시작
                        </button>
                     </div>
                   </div>
                </div>

                <SectionCard title="데이터베이스 관리" description="시스템 데이터 백업 및 정리를 수행합니다.">
                   <div className="flex gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-secondary border-2 border-gray-300 dark:border-gray-500 text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                        <Database size={16} />
                        즉시 백업 생성
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-secondary border-2 border-gray-300 dark:border-gray-500 text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                        <Layout size={16} />
                        캐시 초기화
                      </button>
                   </div>
                </SectionCard>
             </div>
           )}
           
           {/* Global Save Action */}
           <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-300 dark:border-gray-600 mt-8">
             <button className="px-5 py-2.5 text-muted-foreground font-medium hover:bg-accent rounded-xl transition-colors">
               취소
             </button>
             <button className="px-5 py-2.5 bg-secondary dark:bg-primary text-white font-medium rounded-xl hover:bg-muted dark:hover:bg-primary-700 transition-colors shadow-lg shadow-border dark:shadow-emerald-900/20 flex items-center gap-2">
               <Save size={18} />
               변경사항 저장
             </button>
           </div>

        </div>
      </div>
    </div>
  );
};

// --- Helper Components for Clean Code ---

function SectionCard({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
  return (
    <div className="bg-secondary rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, checked = false }: { label: string, description?: string, checked?: boolean }) {
  const [isOn, setIsOn] = useState(checked);
  return (
     <div className="flex items-center justify-between py-2">
       <div>
         <p className="text-sm font-medium text-foreground">{label}</p>
         {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
       </div>
       <button 
         onClick={() => setIsOn(!isOn)}
         className={`w-11 h-6 rounded-full transition-colors relative ${isOn ? 'bg-primary dark:bg-primary' : 'bg-muted '}`}
       >
         <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-secondary shadow-sm transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
       </button>
     </div>
  );
}


function StatusOption({ label, color, selected }: { label: string, color: string, selected?: boolean }) {
  const colorStyles: Record<string, string> = {
    emerald: 'bg-primary/10 text-primary border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-muted text-foreground border-border'
  };

  return (
    <button className={`w-full py-2.5 rounded-lg border text-sm font-medium transition-all ${
      selected 
        ? `${colorStyles[color]} ring-1 ring-${color}-500 ring-offset-1` 
        : 'bg-secondary border-gray-300 dark:border-gray-500 text-muted-foreground hover:bg-muted'
    }`}>
      {label}
    </button>
  );
}

function ThemeOption({ icon: Icon, label, selected }: { icon: any, label: string, selected?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
      selected ? 'border-primary bg-primary/10/50 text-primary' : 'border-border hover:border-border text-muted-foreground'
    }`}>
      <Icon size={24} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// Just inline style helper for inputs to avoid cluttering className repeatedly
const inputStyle = "w-full px-4 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:bg-secondary focus:border-ring focus:ring-2 focus:ring-1 focus:ring-primary/30/50 outline-none transition-all text-sm";
// Injecting style via specialized component isn't strictly necessary if strict Tailwind classes are used directly, 
// ensuring "form-input" class works requires plugin or global css. 
// I will just use standard className in the component for safety.

export default AdminSettings;
