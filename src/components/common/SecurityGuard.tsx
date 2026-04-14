/**
 * 관리자 영역 물리 보안 가드(Administrative Area Physical Security Guard):
 * - 목적(Why): 관리자 페이지(/admin)에 대해 허가되지 않은 네트워크의 접근을 원천 차단하여 인프라 보안을 강화함
 * - 방법(How): 사이트 설정의 IP 화이트리스트 정책을 기반으로 접속자의 공인 IP를 대조하고, 비인가 접속 시 고해상도 차단 오버레이 레이어를 렌더링함
 */
import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

export const SecurityGuard = ({ children }: { children: ReactNode }) => {
    const location = useLocation();
    const { settings } = useSiteSettings();
    const [isBlocked, setIsBlocked] = useState(false);
    const [userIp, setUserIp] = useState<string | null>(null);
    const [reason, setReason] = useState<string>('');

    useEffect(() => {
        const checkSecurity = async () => {
            // Configuration Synchronization: Defers security checks until site settings and global configuration are fully resolved.
            if (!settings || !settings.security_config) return;

            const config = settings.security_config;
            const isAdminPath = location.pathname.startsWith('/admin');

            if (isAdminPath && config.ip_restriction) {
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    const currentIp = data.ip;
                    setUserIp(currentIp);

                    const rawWhitelist = config.ip_whitelist as string | string[] | undefined;
                    const whitelist = typeof rawWhitelist === 'string' 
                        ? rawWhitelist.split(/[,\n]/).map((ip: string) => ip.trim()).filter(Boolean)
                        : (Array.isArray(rawWhitelist) ? rawWhitelist : []);

                    if (!whitelist.includes(currentIp)) {
                        setIsBlocked(true);
                        setReason('허용되지 않은 IP 주소입니다. (관리자 전역 엄격 차단 정책)');
                        return;
                    } else {
                        setIsBlocked(false);
                    }
                } catch (err) {
                    console.error('[SecurityGuard] IP check failed:', err);
                }
            } else {
                setIsBlocked(false);
            }
        };

        checkSecurity();
    }, [location.pathname, settings]); // settings 객체 자체를 감시하여 로드 완료 시 체크 수행

    // Hierarchical Access Enforcement: Activates strict IP restriction layers exclusively for administrative routes (/admin) to ensure zero interference with public-facing paths.
    if (isBlocked && location.pathname.startsWith('/admin')) {
        return (
            <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-card border border-destructive/20 rounded-3xl p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-2 italic">ACCESS DENIED</h2>
                    <div className="h-1 w-12 bg-destructive mx-auto mb-6 rounded-full" />
                    
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                        {reason || '보안 정책에 의해 접근이 제한되었습니다.'}
                    </p>

                    <div className="bg-muted/50 rounded-2xl p-4 mb-8 text-left border border-border">
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                            <Lock size={12} /> Your Identifier
                        </div>
                        <p className="font-mono text-xs font-bold text-foreground">{userIp || 'Checking...'}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => window.location.href = '/'}
                            className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-95"
                        >
                            메인 페이지로 돌아가기
                        </button>
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
                            <AlertTriangle size={12} /> 잘못된 차단이라고 생각되면 시스템 관리자에게 문의하세요.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default SecurityGuard;
