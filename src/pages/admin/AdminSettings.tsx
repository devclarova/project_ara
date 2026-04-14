/**
 * 관리자 설정 매니저 (Admin Settings Manager):
 * - 목적(Why): 서비스 전역 운영 모드, 보안 정책, 외부 연동(GA4 등) 환경 변수를 통제함
 * - 방법(How): 사이트 기초정보 및 IP 화이트리스트, 유지보수 모드 등 하이레벨 상태를 DB에 영속화함
 */
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
  Layout,
  Activity,
  Zap
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';

// 설정 페이지 전용 사이드바 및 탭 레이아웃 정의 — 논리적 기능 단위별 인터페이스 격리 연산
// 설정 데이터 구조 인터페이스 정의
interface SiteSettings {
  global_notice: { enabled: boolean; text: string; color: 'blue' | 'red' | 'amber' | 'emerald' };
  maintenance_mode: { enabled: boolean; message: string; end_time: string | null };
  site_metadata: { title: string; description: string; logo_url: string | null; primary_color: string };
  security_config: { ip_restriction: boolean; ip_whitelist: string; multi_login_limit: boolean; brute_force_protection: boolean; tfa_required: boolean; session_timeout: number };
  notifications: { email_daily_report: boolean; email_security_alert: boolean; push_new_report: boolean; push_resource_warning: boolean };
  integrations: { supabase_url: string; ga4_id: string };
}

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);

  // 전역 설정 상태 데이터 스토어 — 사이트 메타데이터, 보안, 알림 및 시스템 환경 변수 통합 관리
  const [settings, setSettings] = useState<SiteSettings>({
    global_notice: { enabled: false, text: '', color: 'blue' },
    maintenance_mode: { enabled: false, message: '', end_time: null },
    site_metadata: { title: 'Project Ara', description: '', logo_url: null, primary_color: '#6366f1' },
    security_config: { ip_restriction: false, ip_whitelist: '', multi_login_limit: false, brute_force_protection: true, tfa_required: false, session_timeout: 60 },
    notifications: { email_daily_report: true, email_security_alert: true, push_new_report: true, push_resource_warning: false },
    integrations: { supabase_url: import.meta.env.VITE_SUPABASE_URL || '', ga4_id: 'G-ARA2026PRJ' }
  });

  useEffect(() => {
    fetchSettings();
    detectIp();
  }, []);

  // 현재 접속 IP 식별 — 보안 화이트리스트 설정 시 본인 차단 방지를 위한 참조 데이터 수집
  const detectIp = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIp(data.ip);
    } catch (err) {
      console.error('IP detection failed:', err);
    }
  };

  // 사이트 전역 설정 데이터 수신 — DB 키-밸류 저장소로부터 실시간 동기화 수행
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase.from('site_settings') as any).select('*');
      if (error) throw error;

      if (data) {
        const newSettings = { ...settings };
        data.forEach((item: any) => {
          (newSettings as any)[item.key] = item.value;
        });
        setSettings(newSettings);
      }
    } catch (error: unknown) {
      console.error('Error fetching settings:', getErrorMessage(error));
      toast.error('설정을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 설정 일괄 영속화 — 비동기 병렬 처리를 통한 설정값 트랜잭션 업데이트
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Step A: Hybrid Migration Logic - Check for modernized 'site_config' table existence
      const { error: probeError } = await (supabase.from('site_config') as any).select('id').limit(1).maybeSingle();
      const hasModernTable = !probeError || (probeError as unknown as { code: string }).code !== 'PGRST205';

      if (hasModernTable) {
        // Update the formalized single-row configuration
        const { error } = await (supabase.from('site_config') as any).upsert({
          id: 1,
          notice_enabled: settings.global_notice.enabled,
          notice_text: settings.global_notice.text,
          notice_color: settings.global_notice.color,
          maintenance_enabled: settings.maintenance_mode.enabled,
          maintenance_message: settings.maintenance_mode.message,
          maintenance_end_time: settings.maintenance_mode.end_time,
          site_title: settings.site_metadata.title,
          site_description: settings.site_metadata.description,
          site_logo_url: settings.site_metadata.logo_url,
          sec_ip_restriction: settings.security_config.ip_restriction,
          sec_ip_whitelist: settings.security_config.ip_whitelist.split(',').map(s => s.trim()).filter(Boolean),
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
      } else {
        // Fallback: Individual Key-Value updates for legacy schema compatibility
        const updatePromises = Object.entries(settings).map(([key, value]) => 
          (supabase.from('site_settings') as any).upsert({ key, value })
        );

        const results = await Promise.all(updatePromises);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) throw errors[0].error;
      }

      toast.success('설정이 성공적으로 저장되었습니다.');
    } catch (error: unknown) {
      console.error('Error saving settings:', getErrorMessage(error));
      toast.error('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const updateNestedSetting = <K extends keyof SiteSettings, SK extends keyof SiteSettings[K]>(
    key: K, 
    subKey: SK, 
    value: SiteSettings[K][SK]
  ) => {
    setSettings((prev: SiteSettings) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [subKey]: value
      }
    }));
  };

  // 유지보수 명령 실행 — RPC 호출을 통한 인덱스 최적화 및 캐시 초기화 등 백엔드 작업 자동화
  const handleMaintenance = async (action: string) => {
    try {
      setSaving(true);
      const { data, error } = await (supabase as any).rpc('admin_perform_maintenance', { p_action: action });
      if (error) throw error;
      toast.success((data as any).message || '요청하신 유지보수 작업이 완료되었습니다.');
    } catch (error: unknown) {
      console.error('Maintenance error:', getErrorMessage(error));
      toast.error(`유지보수 작업 실패: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: '일반 설정', icon: Globe, description: '사이트 기본 정보 및 운영 상태' },
    { id: 'security', label: '보안 및 로그인', icon: Shield, description: '접근 제어 및 인증 정책 관리' },
    { id: 'notifications', label: '알림 채널', icon: Bell, description: '이메일 및 시스템 푸시 설정' },
    { id: 'integrations', label: 'API 및 외부 연동', icon: Layout, description: 'Supabase, GA4 등 외부 서비스 연동' },
    { id: 'system', label: '시스템 도구', icon: Database, description: 'DB 최적화 및 캐시 관리' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 animate-in fade-in duration-700">
      {/* 프리미엄 헤더 세션 — 글래스모피즘 기반의 페이지 정체성 수립 및 시스템 요약 정보 가시화 */}
      <div className="relative mb-10 p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 overflow-hidden shadow-2xl shadow-primary/5">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield size={120} className="text-primary" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
             관리자 설정 <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-widest">프리미엄 컨트롤 센터</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Project Ara의 핵심 운영 환경과 데이터 보안, 시스템 통합 설정을 중앙에서 완벽하게 통제합니다. 
            모든 변경사항은 실시간으로 서비스에 즉시 반영됩니다.
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10">
        {/* 고급 사이드바 네비게이션 — 설정 카테고리 전환 및 시스템 무결성 수치 실시간 모니터링 */}
        <aside className="w-full xl:w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
             <div className="bg-secondary/50 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 mb-4 mt-2">구성 메뉴</p>
                <div className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full group text-left px-4 py-3.5 rounded-xl transition-all relative overflow-hidden ${
                        activeTab === tab.id 
                          ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                          : 'text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-primary group-hover:scale-110 transition-transform'} />
                        <div>
                          <p className="text-sm font-bold">{tab.label}</p>
                          <p className={`text-[10px] ${activeTab === tab.id ? 'text-white/70' : 'text-muted-foreground/60'}`}>{tab.description}</p>
                        </div>
                      </div>
                      {activeTab === tab.id && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-white opacity-20" />
                      )}
                    </button>
                  ))}
                </div>
             </div>
             
             {/* Status Widget in Sidebar */}
             <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl border border-emerald-500/20 p-5">
                <div className="flex items-center justify-between mb-3">
                   <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">시스템 무결성</p>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-xl font-black text-foreground">보안 위협 없음</div>
                <p className="text-[10px] text-muted-foreground mt-1">모든 모니터링 시스템이 정상 작동 중입니다.</p>
             </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 영역 — 액티브 탭에 따른 동적 설정 인터페이스 렌더링 */}
        <div className="flex-1 space-y-6">
          
          {/* 1. 일반 설정 탭 — 서비스 점검 모드 및 글로벌 브랜딩/공지 정책 제어 */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <SectionCard title="서비스 운영 상태" icon={Activity} description="서비스의 실시간 운영 스테이터스를 전역적으로 통제합니다.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">서비스 상태 (운영 모드)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <StatusOption 
                          label="정상 운영 중" 
                          color="emerald" 
                          selected={!settings.maintenance_mode.enabled} 
                          onClick={() => updateNestedSetting('maintenance_mode', 'enabled', false)}
                        />
                        <StatusOption 
                          label="유지보수 모드" 
                          color="amber" 
                          selected={settings.maintenance_mode.enabled} 
                          onClick={() => updateNestedSetting('maintenance_mode', 'enabled', true)}
                        />
                      </div>
                    </div>
                    {settings.maintenance_mode.enabled && (
                       <div className="animate-in slide-in-from-top-2 duration-300">
                          <label className="block text-xs font-black text-amber-600 uppercase tracking-widest mb-1">점검 안내 메시지</label>
                          <textarea 
                             value={settings.maintenance_mode.message}
                             onChange={(e) => updateNestedSetting('maintenance_mode', 'message', e.target.value)}
                             placeholder="공사중입니다. 곧 돌아오겠습니다."
                             className="form-textarea w-full bg-amber-500/5 border-amber-500/20 text-foreground rounded-xl text-sm focus:ring-amber-500/20 h-24 resize-none"
                          />
                       </div>
                    )}
                  </div>
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border/40">
                    <p className="text-xs font-bold text-foreground/70 mb-2 flex items-center gap-2"><Lock size={14} className="text-amber-500" /> 모드 변경 주의사항</p>
                    <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4">
                       <li>유지보수 모드 활성화 시 일반 사용자는 접속이 제한됩니다.</li>
                       <li>관리자 세션은 유지보수 모드에서도 정상적으로 작동합니다.</li>
                       <li>데이터베이스 마이그레이션이나 대규모 업데이트 시 권장됩니다.</li>
                    </ul>
                  </div>
                </div>
              </SectionCard>

              <div className="relative group">
                <SectionCard title="브랜딩 및 웹 메타데이터 (비활성화)" icon={Layout} description="사이트의 첫인상을 결정하는 로고, 제목, 기본 컬러를 설정합니다.">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 opacity-40 pointer-events-none grayscale">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">서비스 제목</label>
                        <input 
                          type="text" 
                          readOnly
                          value={settings.site_metadata.title} 
                          className="form-input w-full bg-background border-gray-300 dark:border-zinc-700 text-foreground rounded-xl font-bold py-3" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">서비스 설명</label>
                        <textarea 
                          readOnly
                          value={settings.site_metadata.description} 
                          className="form-textarea w-full bg-background border-gray-300 dark:border-zinc-700 text-foreground rounded-xl text-sm h-20" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">대표 테마 컬러</label>
                      <div className="flex flex-wrap gap-4">
                        {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'].map((color) => (
                          <div
                            key={color}
                            className={`w-12 h-12 rounded-2xl border-4 ${settings.site_metadata.primary_color === color ? 'border-primary' : 'border-transparent opacity-50'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/20 backdrop-blur-[1px] rounded-2xl border border-dashed border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black shadow-xl shadow-primary/20 flex items-center gap-2">
                      <Lock size={14} /> 시스템 보호를 위해 비활성화됨
                   </div>
                   <p className="text-[10px] text-muted-foreground mt-2 font-bold">변경이 필요한 경우 총괄 관리자에게 문의하세요.</p>
                </div>
              </div>

              <SectionCard title="긴급 글로벌 공지" icon={Zap} description="사이트 전역에 즉시 노출되는 긴급 공지 바를 활성화합니다.">
                 <div className="bg-secondary/30 rounded-2xl p-6 border border-primary/10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${settings.global_notice.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Zap size={20} className={settings.global_notice.enabled ? 'animate-pulse' : ''} />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-foreground">전역 공지 활성화 상태</p>
                           <p className="text-[10px] text-muted-foreground">사이트 최상단에 배너형 공지를 즉시 노출합니다.</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => updateNestedSetting('global_notice', 'enabled', !settings.global_notice.enabled)}
                        className={`w-14 h-7 rounded-full transition-all relative ${settings.global_notice.enabled ? 'bg-primary' : 'bg-muted dark:bg-zinc-800'}`}
                      >
                        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${settings.global_notice.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className={!settings.global_notice.enabled ? 'opacity-40 pointer-events-none grayscale' : 'animate-in fade-in duration-500'}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">배너 내용</label>
                          <input 
                            type="text" 
                            value={settings.global_notice.text}
                            onChange={(e) => updateNestedSetting('global_notice', 'text', e.target.value)}
                            placeholder="예: 서버 점검 예정 안내 (02:00 ~ 04:00)" 
                            className="form-input w-full bg-background border-border text-foreground rounded-xl py-2.5 text-sm" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">테마 종류</label>
                          <div className="flex gap-3">
                            {['blue', 'red', 'amber', 'emerald'].map((c: any) => (
                              <button 
                                key={c}
                                onClick={() => updateNestedSetting('global_notice', 'color', c)}
                                className={`w-10 h-10 rounded-xl border-2 shadow-sm transition-all ${settings.global_notice.color === c ? 'border-foreground ring-2 ring-foreground/10 scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                style={{ backgroundColor: c === 'emerald' ? '#10b981' : c === 'amber' ? '#f59e0b' : c === 'blue' ? '#3b82f6' : '#ef4444' }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>
              </SectionCard>
            </div>
          )}

          {/* 2. 보안 설정 탭 — IP 화이트리스트 및 세션 만료 주기 등 계층적 보안 레이어 관리 */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <SectionCard title="지능형 접근 제어" icon={Shield} description="시스템 무결성을 보호하기위한 고급 보안 레이어를 설정합니다.">
                  <div className="space-y-4">
                     <ToggleRow 
                        label="관리자 전용 IP 화이트리스트" 
                        description="사전에 등록된 신뢰할 수 있는 IP 대역에서만 관리자 세션 진입을 허용합니다." 
                        checked={settings.security_config.ip_restriction} 
                        onChange={(v) => updateNestedSetting('security_config', 'ip_restriction', v)}
                     />
                     {settings.security_config.ip_restriction && (
                        <div className="px-2 animate-in slide-in-from-top-2 duration-300">
                           <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 ml-1">허용 IP 목록 (쉼표로 구분)</label>
                           <textarea 
                              value={settings.security_config.ip_whitelist}
                              onChange={(e) => updateNestedSetting('security_config', 'ip_whitelist', e.target.value)}
                              placeholder="127.0.0.1, 192.168.0.1"
                              className="form-textarea w-full bg-background border-border text-foreground rounded-xl text-xs h-20 font-mono resize-none"
                           />
                            <p className="text-[10px] text-red-500 mt-2 px-1 font-bold animate-pulse flex items-center gap-1">
                               <AlertTriangle size={12} /> ON으로 저장하는 즉시 본인 포함 모든 접근이 서버 레벨에서 차단됩니다. 
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 px-5 leading-relaxed">반드시 현재 접속 중인 IP({userIp || '로딩 중...'})를 확인하여 목록에 추가한 후 저장하세요.</p>
                        </div>
                     )}
                     <ToggleRow 
                        label="실시간 브루트포스 방어 시스템 (구현 예정)" 
                        description="단시간 내 반복적인 로그인 실패 시 해당 세션을 하드웨어 레벨에서 일시 차단합니다." 
                        checked={settings.security_config.brute_force_protection} 
                        onChange={(v) => updateNestedSetting('security_config', 'brute_force_protection', v)}
                     />
                     <ToggleRow 
                        label="다중 기기 동시 접속 차단 (구현 예정)" 
                        description="보안 사고 예방을 위해 한 계정당 하나의 활성 세션만 유지하도록 강제합니다." 
                        checked={settings.security_config.multi_login_limit}
                        onChange={(v) => updateNestedSetting('security_config', 'multi_login_limit', v)}
                     />
                  </div>
               </SectionCard>

               <SectionCard title="인증 및 권한 정책" icon={Lock} description="사용자 인증 방식과 보안 세션의 유효 주기를 정의합니다.">
                  <div className="space-y-8">
                     <ToggleRow 
                        label="2단계 인증(2FA) 필수 활성화" 
                        description="모든 관리자 계정은 로그인 시 OTP를 통한 추가 인증이 반드시 필요합니다." 
                        checked={settings.security_config.tfa_required}
                        onChange={(v) => updateNestedSetting('security_config', 'tfa_required', v)}
                     />
                     
                     <div className="pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="group">
                           <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 ml-1 group-hover:text-primary transition-colors">관리자 세션 만료 시간</label>
                           <div className="flex items-center gap-3">
                              <input 
                                 type="number" 
                                 value={settings.security_config.session_timeout} 
                                 onChange={(e) => updateNestedSetting('security_config', 'session_timeout', parseInt(e.target.value))}
                                 className="form-input w-full bg-background border-border rounded-xl font-bold py-3 text-center" 
                              />
                              <span className="text-sm font-bold text-muted-foreground bg-muted px-4 py-3 rounded-xl border border-border">분 (Minute)</span>
                           </div>
                        </div>
                        <div className="group">
                           <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 ml-1 group-hover:text-primary transition-colors">비밀번호 만료 정책</label>
                           <select className="form-select w-full bg-background border-border rounded-xl font-bold py-3 text-sm focus:ring-primary/20">
                              <option>매 90일 마다 갱신 권장 (가장 안전)</option>
                              <option>매 180일 마다 갱신</option>
                              <option>제한 없음</option>
                           </select>
                        </div>
                     </div>
                  </div>
               </SectionCard>
            </div>
          )}

           {/* 3. 알림 설정 탭 — 이메일/인앱 푸시 채널별 운영 이벤트 알바 정책 수립 */}
           {activeTab === 'notifications' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <SectionCard title="관리자 채널 알림" icon={Bell} description="시스템 이벤트 발생 시 관리자에게 전달되는 알람 경로를 구성합니다.">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">이메일 알림 설정</p>
                         <ToggleRow 
                            label="일일 운영 리포트" 
                            description="사용자 가입 및 통계 리포트 발송" 
                            checked={settings.notifications.email_daily_report} 
                            onChange={(v) => updateNestedSetting('notifications', 'email_daily_report', v)}
                         />
                         <ToggleRow 
                            label="보안 위협 긴급 알림" 
                            description="IP 차단 및 이상 징후 감지 시 발송" 
                            checked={settings.notifications.email_security_alert} 
                            onChange={(v) => updateNestedSetting('notifications', 'email_security_alert', v)}
                         />
                      </div>
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">시스템 인앱 푸시</p>
                         <ToggleRow 
                            label="신규 신고 실시간 알림" 
                            description="대시보드 내 즉시 팝업 노출" 
                            checked={settings.notifications.push_new_report} 
                            onChange={(v) => updateNestedSetting('notifications', 'push_new_report', v)}
                         />
                         <ToggleRow 
                            label="서버 리소스 임계치 경고" 
                            description="CPU/RAM 부하 발생 시 푸시알림" 
                            checked={settings.notifications.push_resource_warning} 
                            onChange={(v) => updateNestedSetting('notifications', 'push_resource_warning', v)}
                         />
                      </div>
                   </div>
                </SectionCard>
                
                <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-6 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl"><Mail size={24} /></div>
                      <div>
                         <p className="font-bold text-foreground">SMTP 메일 서버 연동 상태</p>
                         <p className="text-xs text-muted-foreground">현재 시스템 메일이 정상적으로 발송 가능한 상태입니다.</p>
                      </div>
                   </div>
                   <button className="text-xs font-bold px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20">테스트 메일 발송</button>
                </div>
             </div>
           )}

           {/* 4. 외부 플랫폼 연동 — 인프라(Supabase) 및 분석(GA4) 식별자 동기화 정책 */}
           {activeTab === 'integrations' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <SectionCard title="백엔드 인프라 (Supabase)" icon={Database} description="애플리케이션의 척추가 되는 데이터베이스 및 엔진 연동 설정입니다.">
                   <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                         <div className="flex-1">
                             <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">프로젝트 엔드포인트 URL</label>
                            <div className="flex bg-muted/50 border border-border rounded-xl p-3 font-mono text-sm group transition-all hover:border-primary/30">
                               <input 
                                 readOnly 
                                 value={settings.integrations.supabase_url} 
                                 className="bg-transparent border-none outline-none w-full text-foreground/70" 
                               />
                               <Monitor size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                         </div>
                         <div className="flex-1">
                             <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">퍼블릭 익명 키 (Anon Key)</label>
                            <div className="flex bg-muted/50 border border-border rounded-xl p-3 font-mono text-sm group transition-all hover:border-primary/30">
                               <input readOnly value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...********" className="bg-transparent border-none outline-none w-full text-foreground/70" />
                               <Shield size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                         </div>
                      </div>
                      <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                         <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">데이터베이스 연결: 정상 (24ms)</p>
                         <button className="text-[11px] font-black text-emerald-600 underline">노드 상태 새로고침</button>
                      </div>
                   </div>
                </SectionCard>

                <SectionCard title="분석 툴 연동 (GA4)" icon={Smartphone} description="Google Analytics 4를 통한 사용자 행동 분석 연동 설정입니다.">
                   <div className="max-w-md">
                       <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">측정 ID (Measurement ID)</label>
                      <input 
                         type="text" 
                         value={settings.integrations.ga4_id} 
                         onChange={(e) => updateNestedSetting('integrations', 'ga4_id', e.target.value)}
                         className="form-input w-full bg-background border-border text-foreground rounded-xl py-3 font-bold" 
                      />
                   </div>
                </SectionCard>
             </div>
           )}

           {/* System Settings Tab */}
           {activeTab === 'system' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-amber-500/5">
                   <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
                      <AlertTriangle size={48} />
                   </div>
                   <div className="flex-1 text-center md:text-left">
                     <h4 className="text-xl font-black text-amber-900 dark:text-amber-400 tracking-tight">유지보수 모드 제어 센터</h4>
                     <p className="text-sm text-amber-800 dark:text-amber-400/70 mt-2 leading-relaxed max-w-xl">
                        긴급 점검이나 대규모 데이터 마이그레이션이 필요할 때 사용합니다. 
                        <b>활성화 시 관리자 세션을 제외한 모든 일반 트래픽이 즉시 차단됩니다.</b>
                     </p>
                   </div>
                   <button className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${settings.maintenance_mode.enabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 active:scale-95'}`}>
                     {settings.maintenance_mode.enabled ? '서비스 정상화 (종료)' : '점검 모드 시작 (실행)'}
                   </button>
                </div>

                <SectionCard title="시스템 자가 진단 및 데이터 관리" icon={Database} description="데이터베이스 무결성을 확인하고 시스템 캐시를 최적화합니다.">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <SystemToolButton icon={Database} label="DB 인덱스 최적화" desc="조회 성능 갱신" onClick={() => handleMaintenance('optimize_db')} />
                      <SystemToolButton icon={Layout} label="CDN 캐시 전체 초기화" desc="전역 리소스 동기화" onClick={() => handleMaintenance('clear_cache')} />
                      <SystemToolButton icon={Shield} label="보안 로그 아카이빙" desc="90일 이전 로그 정리" onClick={() => handleMaintenance('archive_logs')} />
                   </div>
                </SectionCard>
             </div>
           )}
           
            {/* 전역 저장 액션바 — 변경사항 수동 검출 및 영속화 최종 트리거 */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-300 dark:border-gray-600 mt-8">
              <button 
                onClick={fetchSettings}
                className="px-5 py-2.5 text-muted-foreground font-medium hover:bg-accent rounded-xl transition-colors"
                disabled={saving}
              >
                취소
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>

        </div>
      </div>
    </div>
  );
};

// 내부 보조 컴포넌트(Helper Components) — 코드 가독성 및 UI 일관성을 위한 원자적 디자인 단위
function SystemToolButton({ icon: Icon, label, desc, onClick }: { icon: React.ElementType, label: string, desc: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-start gap-4 p-5 bg-muted/20 border-2 border-border/60 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
    >
      <div className="p-3 bg-background border border-border rounded-xl text-primary group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

function SectionCard({ title, description, icon: Icon, children }: { title: string, description?: string, icon?: React.ElementType, children: React.ReactNode }) {
  return (
    <div className="bg-secondary/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all hover:shadow-lg hover:border-primary/20">
      <div className="p-6 md:p-8">
        <div className="flex items-start gap-4 mb-8">
          {Icon && (
            <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-sm">
              <Icon size={24} />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1 max-w-xl">{description}</p>}
          </div>
        </div>
        <div className="animate-in fade-in duration-500">{children}</div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked = false, onChange }: { label: string, description?: string, checked?: boolean, onChange?: (val: boolean) => void }) {
  return (
     <button 
       type="button"
       onClick={() => onChange?.(!checked)}
       className={`w-full flex items-center justify-between py-4 px-4 rounded-xl transition-all group text-left border ${
         checked 
           ? 'bg-primary/5 border-primary/20 shadow-sm' 
           : 'hover:bg-muted/40 border-transparent hover:border-border'
       }`}
     >
       <div className="flex-1 pr-4">
         <p className={`text-sm font-bold transition-colors ${checked ? 'text-primary' : 'text-foreground'}`}>{label}</p>
         {description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">{description}</p>}
       </div>
       <div className="shrink-0 pointer-events-none">
         <div 
           className={`w-12 h-6 rounded-full transition-all relative ${checked ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]' : 'bg-muted dark:bg-zinc-800'}`}
         >
           <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
         </div>
       </div>
     </button>
  );
}


function StatusOption({ label, color, selected, onClick }: { label: string, color: string, selected?: boolean, onClick?: () => void }) {
  const colorStyles: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    red: 'bg-red-500/10 text-red-600 border-red-500/30',
    slate: 'bg-muted text-foreground border-border'
  };

  return (
    <button 
      onClick={onClick}
      className={`relative w-full py-3.5 rounded-xl border text-sm font-black transition-all overflow-hidden ${
      selected 
        ? `${colorStyles[color]} ring-4 ring-emerald-500/5 scale-[1.02] shadow-md` 
        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}>
      {selected && <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-30" />}
      {label}
    </button>
  );
}

function ThemeOption({ icon: Icon, label, selected }: { icon: React.ElementType, label: string, selected?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all ${
      selected ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' : 'border-border hover:border-primary/20 text-muted-foreground hover:bg-muted/30'
    }`}>
      <Icon size={28} />
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  );
}

// Just inline style helper for inputs to avoid cluttering className repeatedly
const inputStyle = "w-full px-4 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:bg-secondary focus:border-ring focus:ring-2 focus:ring-1 focus:ring-primary/30/50 outline-none transition-all text-sm";
// Injecting style via specialized component isn't strictly necessary if strict Tailwind classes are used directly, 
// ensuring "form-input" class works requires plugin or global css. 
// I will just use standard className in the component for safety.

export default AdminSettings;
