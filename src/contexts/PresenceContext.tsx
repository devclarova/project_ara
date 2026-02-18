import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface PresenceState {
  user_id: string;
  online_at: string;
  status: 'online' | 'offline';
}

interface RealtimeStats {
  totalUsers: number;
  onlineUsersCount: number;
  activeSessions: number;
  adminCount: number;
  bannedCount: number;
  newUsers7d: number;
  pendingReports: number;
}

interface PresenceContextType {
  onlineUsers: Set<string>;
  dbOnlineUsers: Record<string, boolean>; 
  onlineCount: number;
  sessionCount: number;
  stats: RealtimeStats;
  isUserOnline: (profileId: string | undefined) => boolean;
  updateDbStatus: (userId: string, isOnline: boolean) => void;
  refreshStats: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profileId } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [dbOnlineUsers, setDbOnlineUsers] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<RealtimeStats>({
    totalUsers: 0,
    onlineUsersCount: 0,
    activeSessions: 0,
    adminCount: 0,
    bannedCount: 0,
    newUsers7d: 0,
    pendingReports: 0
  });

  const channelRef = useRef<any>(null);

  // 전역 통계 새로고침 함수
  const refreshStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (!error && data) {
        setStats(prev => ({
          ...prev,
          totalUsers: data.total_users || 0,
          adminCount: data.admin_count || 0,
          bannedCount: data.banned_count || 0,
          newUsers7d: data.new_users_7d || 0,
          pendingReports: data.pending_reports || 0,
          // onlineUsersCount와 activeSessions는 Presence 채널에서 실시간 업데이트됨
        }));
      }
    } catch (err) {
      console.error('Failed to refresh global stats:', err);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000); // 30초마다 DB 데이터 동기화
    return () => clearInterval(interval);
  }, [refreshStats]);

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

  // DB 실시간 상태 구독 (is_online 필드 변경 감지)
  useEffect(() => {
    const channel = supabase
      .channel('global-is-online-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new as any;
          if (updated.is_online !== undefined) {
             setDbOnlineUsers(prev => {
               const next = { ...prev };
               if (updated.id) next[updated.id] = updated.is_online;
               if (updated.user_id) next[updated.user_id] = updated.is_online;
               return next;
             });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isUserOnline = useCallback((pId: string | undefined): boolean => {
    if (!pId) return false;
    // 1. 실시간 프레즌스 데이터에서 확인
    if (onlineUsers.has(pId)) return true;
    // 2. DB 실시간 동기화 상태에서 확인 (폴백)
    return dbOnlineUsers[pId] ?? false;
  }, [onlineUsers, dbOnlineUsers]);

  const updateDbStatus = useCallback((userId: string, isOnline: boolean) => {
    setDbOnlineUsers(prev => ({ ...prev, [userId]: isOnline }));
  }, []);

  const value = useMemo(() => ({
    onlineUsers,
    dbOnlineUsers,
    onlineCount: onlineUsers.size,
    sessionCount: stats.activeSessions,
    stats,
    isUserOnline,
    updateDbStatus,
    refreshStats
  }), [onlineUsers, dbOnlineUsers, stats, isUserOnline, updateDbStatus, refreshStats]);

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
