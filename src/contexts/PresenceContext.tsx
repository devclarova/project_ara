import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { retryWithBackoff, isOnline } from '@/utils/networkUtils';

export interface PresenceState {
  user_id: string;
  online_at: string;
  status: 'online' | 'offline';
}

interface RealtimeStats {
  totalUsers: number;
  onlineUsersCount: number;
  dbOnlineUsersCount: number;
  activeSessions: number;
  adminCount: number;
  bannedCount: number;
  newUsers7d: number;
  pendingReports: number;
}

interface PresenceContextType {
  onlineUsers: Set<string>;
  dbOnlineUsers: Record<string, { is_online: boolean; last_active_at: string | null }>;
  onlineCount: number;
  sessionCount: number;
  stats: RealtimeStats;
  isUserOnline: (profileId: string | undefined) => boolean;
  updateDbStatus: (userId: string, isOnline: boolean) => void;
  refreshStats: () => Promise<void>;
}

const ZOMBIE_THRESHOLD_MS = 5 * 60 * 1000; // 5분

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profileId, isAdmin } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [dbOnlineUsers, setDbOnlineUsers] = useState<Record<string, { is_online: boolean; last_active_at: string | null }>>({});
  const [stats, setStats] = useState<RealtimeStats>({
    totalUsers: 0,
    onlineUsersCount: 0,
    dbOnlineUsersCount: 0,
    activeSessions: 0,
    adminCount: 0,
    bannedCount: 0,
    newUsers7d: 0,
    pendingReports: 0
  });

  const channelRef = useRef<any>(null);

  // ============================================================
  // 1. 전역 통계 새로고침 (관리자 전용)
  // ============================================================
  const refreshStats = useCallback(async () => {
    if (!isAdmin || !isOnline()) return;
    
    try {
      await retryWithBackoff(async () => {
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        if (error) throw error;
        if (data) {
          setStats(prev => ({
            ...prev,
            totalUsers: data.total_users || 0,
            dbOnlineUsersCount: data.online_users || 0,
            adminCount: data.admin_count || 0,
            bannedCount: data.banned_count || 0,
            newUsers7d: data.new_users_7d || 0,
            pendingReports: data.pending_reports || 0,
          }));
        }
      }, {
        maxAttempts: 2,
        shouldRetry: (err: any) => {
          const msg = err?.message?.toLowerCase() || '';
          return msg.includes('fetch') || msg.includes('network');
        }
      });
    } catch (err: any) {
      // 네트워크 오류는 조용히 무시 (다음 주기에 시도)
      const msg = err?.message?.toLowerCase() || '';
      const isNetworkError = msg.includes('fetch') || msg.includes('network');
      if (!isNetworkError) {
        console.error('Failed to refresh global stats:', err);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  // ============================================================
  // 2. 💎 초기 DB 온라인 상태 일괄 로드 (핵심 수정)
  //    → 페이지 로드 시 DB의 is_online + last_active_at 스냅샷을 가져옴
  // ============================================================
  useEffect(() => {
    const fetchInitialOnlineStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, is_online, last_active_at')
          .eq('is_online', true);
        
        if (!error && data) {
          const initial: Record<string, { is_online: boolean; last_active_at: string | null }> = {};
          data.forEach((p: any) => {
            initial[p.id] = { is_online: p.is_online, last_active_at: p.last_active_at };
          });
          setDbOnlineUsers(initial);
        }
      } catch (err) {
        console.error('Failed to fetch initial online status:', err);
      }
    };

    fetchInitialOnlineStatus();
  }, []);

  // ============================================================
  // 3. 웹소켓 Presence 채널 (실시간 접속 감지)
  // ============================================================
  useEffect(() => {
    if (!user || !profileId) {
      setOnlineUsers(new Set());
      return;
    }

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: profileId,
        },
      },
    });
    channelRef.current = channel;

    channel
      .on('presence' as any, { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Set<string>();
        let totalSessions = 0;

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          users.add(key);
          totalSessions += (presences?.length || 0);
        });

        setOnlineUsers(users);
        setStats(prev => ({
          ...prev,
          onlineUsersCount: users.size,
          activeSessions: totalSessions
        }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Detect country via IP and update profile
          try {
            const geoRes = await fetch('https://ipapi.co/json/');
            const geoData = await geoRes.json();
            if (geoData?.country_code) {
              await supabase
                .from('profiles')
                .update({ last_known_country: geoData.country_code })
                .eq('id', profileId);
            }
          } catch (err) {
            console.warn('Failed to detect geolocation:', err);
          }

          await channel.track({
            profile_id: profileId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, profileId]);

  // ============================================================
  // 4. DB 실시간 상태 구독 (is_online 필드 변경 감지 → 실시간 반영)
  // ============================================================
  useEffect(() => {
    const channel = supabase
      .channel('global-is-online-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new as any;
          if (updated.is_online !== undefined && updated.id) {
             setDbOnlineUsers(prev => ({
               ...prev,
               [updated.id]: {
                 is_online: updated.is_online,
                 last_active_at: updated.last_active_at || null
               }
             }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ============================================================
  // 5. 💎 좀비 방어 통합 온라인 판정 함수
  //    → 웹소켓 확인 → DB 확인 (5분 이내 활동만 인정)
  // ============================================================
  const isUserOnline = useCallback((pId: string | undefined): boolean => {
    if (!pId) return false;
    // 1. 실시간 프레즌스(웹소켓)에서 확인 — 가장 확실
    if (onlineUsers.has(pId)) return true;
    // 2. DB 실시간 동기화 상태에서 확인 (좀비 방어: 5분 이내 활동만 허용)
    const dbStatus = dbOnlineUsers[pId];
    if (dbStatus?.is_online && dbStatus.last_active_at) {
      const lastActiveTime = new Date(dbStatus.last_active_at).getTime();
      return (Date.now() - lastActiveTime) < ZOMBIE_THRESHOLD_MS;
    }
    return false;
  }, [onlineUsers, dbOnlineUsers]);

  const updateDbStatus = useCallback((userId: string, isOnline: boolean) => {
    setDbOnlineUsers(prev => ({
      ...prev,
      [userId]: { is_online: isOnline, last_active_at: new Date().toISOString() }
    }));
  }, []);

  // ============================================================
  // 6. 실시간 온라인 카운트 계산 (웹소켓 + DB 5분 임계치 합산)
  // ============================================================
  const computedOnlineCount = useMemo(() => {
    const onlineSet = new Set(onlineUsers);
    const now = Date.now();
    Object.entries(dbOnlineUsers).forEach(([pId, status]) => {
      if (status.is_online && status.last_active_at) {
        const lastActiveTime = new Date(status.last_active_at).getTime();
        if ((now - lastActiveTime) < ZOMBIE_THRESHOLD_MS) {
          onlineSet.add(pId);
        }
      }
    });
    return onlineSet.size;
  }, [onlineUsers, dbOnlineUsers]);

  const value = useMemo(() => ({
    onlineUsers,
    dbOnlineUsers,
    onlineCount: computedOnlineCount,
    sessionCount: stats.activeSessions,
    stats: {
      ...stats,
      dbOnlineUsersCount: computedOnlineCount, // 실시간 계산된 값으로 덮어씀
    },
    isUserOnline,
    updateDbStatus,
    refreshStats
  }), [onlineUsers, dbOnlineUsers, stats, computedOnlineCount, isUserOnline, updateDbStatus, refreshStats]);

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
