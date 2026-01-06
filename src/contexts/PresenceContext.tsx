import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface PresenceState {
  user_id: string;
  online_at: string;
  status: 'online' | 'offline';
}

interface PresenceContextType {
  onlineUsers: Set<string>;
  dbOnlineUsers: Record<string, boolean>; // DB 기반 온라인 상태 맵 추가
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [dbOnlineUsers, setDbOnlineUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      setOnlineUsers(new Set());
      return;
    }

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence' as any, { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const onlineIds = new Set<string>();
        
        Object.keys(newState).forEach((key) => {
          onlineIds.add(key);
        });
        
        setOnlineUsers(onlineIds);
      })
      .on('presence' as any, { event: 'join' }, ({ newPresences }) => {
        // console.log('Joined:', newPresences);
      })
      .on('presence' as any, { event: 'leave' }, ({ leftPresences }) => {
        // console.log('Left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // DB 실시간 상태 구독 (is_online 필드 변경 감지)
  useEffect(() => {
    const channel = supabase
      .channel('profile-status-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.new.id) {
            setDbOnlineUsers(prev => ({
              ...prev,
              [payload.new.id]: payload.new.is_online
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value = {
    onlineUsers,
    dbOnlineUsers
  };

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
