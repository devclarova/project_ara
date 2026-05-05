import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Users, 
  Mail, 
  Send, 
  Search, 
  X, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  History,
  User,
  ShieldCheck,
  Megaphone,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TargetUser {
  id: string; // user_id
  profile_id: string; // profiles.id (UUID)
  nickname: string;
  email?: string;
  avatar_url: string | null;
}

const AdminNotificationCenter = () => {
  const { t } = useTranslation();
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'premium' | 'subscribers' | 'manual'>('all');
  const [selectedUsers, setSelectedUsers] = useState<TargetUser[]>([]);
  const [sendTypes, setSendTypes] = useState({ inApp: true, email: false });
  
  // UI State
  const [searchNickname, setSearchNickname] = useState('');
  const [searchResults, setSearchResults] = useState<TargetUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch History
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      // 'updates' 타입의 알림 중 최근 50개를 가져옴 (중복 제거를 위해 content와 created_at 기준 정렬)
      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('type', 'updates')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // 같은 내용의 알림은 하나의 그룹으로 묶어서 표시 (실제로는 발송 이력 테이블이 따로 있는 것이 좋음)
      const groups: any[] = [];
      const seen = new Set();
      
      (data || []).forEach((notif: any) => {
        const key = `${notif.content}-${notif.created_at.substring(0, 16)}`;
        if (!seen.has(key)) {
          seen.add(key);
          groups.push({
            id: notif.id,
            content: notif.content,
            created_at: notif.created_at,
            type: notif.type
          });
        }
      });

      setHistory(groups.slice(0, 20));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Search Users
  useEffect(() => {
    if (targetType !== 'manual' || !searchNickname.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await (supabase
          .from('profiles') as any)
          .select('id, user_id, nickname, avatar_url')
          .ilike('nickname', `%${searchNickname}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(((data as any[]) || []).map((p: any) => ({
          id: p.user_id,
          profile_id: p.id,
          nickname: p.nickname,
          avatar_url: p.avatar_url
        })));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchNickname, targetType]);

  const handleAddUser = (user: TargetUser) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchNickname('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error('내용을 입력해 주세요.');
      return;
    }
    if (targetType === 'manual' && selectedUsers.length === 0) {
      toast.error('발송 대상을 선택해 주세요.');
      return;
    }
    if (!sendTypes.inApp && !sendTypes.email) {
      toast.error('발송 방식을 하나 이상 선택해 주세요.');
      return;
    }

    setShowConfirm(true);
  };

  const executeSend = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      // 1. Get Target Users (both UUID and Auth ID)
      let targetUsers: { id: string; user_id: string }[] = [];
      
      if (targetType === 'manual') {
        targetUsers = selectedUsers.map(u => ({ id: u.profile_id, user_id: u.id }));
      } else {
        let query = (supabase.from('profiles') as any).select('id, user_id');
        
        if (targetType === 'premium') {
          query = query.eq('plan', 'premium');
        } else if (targetType === 'subscribers') {
          query = query.eq('marketing_opt_in', true);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        targetUsers = ((data as any[]) || []).map((u: any) => ({ id: u.id, user_id: u.user_id }));
      }

      if (targetUsers.length === 0) {
        toast.error('발송 대상이 없습니다.');
        return;
      }

      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Admin session not found');

      // Get admin's profile ID (FeedbackActionModal pattern)
      const { data: adminProfile } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', adminUser.id)
        .maybeSingle();

      // 2. Send In-App Notifications
      if (sendTypes.inApp) {
        // Bulk insert using profiles.id (UUID)
        const notifications = targetUsers.map(profile => ({
          receiver_id: profile.id,
          sender_id: adminProfile?.id,
          type: 'updates',
          content: content.trim(),
          is_read: false
        }));

        // Batch size management for very large numbers
        const BATCH_SIZE = 1000;
        for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
          const batch = notifications.slice(i, i + BATCH_SIZE);
          const { error: insertError } = await (supabase
            .from('notifications') as any)
            .insert(batch);
          if (insertError) throw insertError;
        }
      }

      // 3. Send Emails
      if (sendTypes.email) {
        // Fetch emails via RPC for each target user as direct email access on profiles is restricted
        const emailTargets: any[] = [];
        
        await Promise.all(targetUsers.map(async (profile) => {
          try {
            const { data: email } = await (supabase as any).rpc('get_user_email_admin', {
              p_user_id: profile.user_id
            });
            if (email) {
              emailTargets.push({ user_id: profile.user_id, email });
            }
          } catch (e) {
            console.error(`Error fetching email for ${profile.user_id}:`, e);
          }
        }));

        if (emailTargets.length > 0) {
          
          // Non-blocking email sending
          Promise.all(emailTargets.map(async (p) => {
            try {
              await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: p.email,
                  subject: title || '[ARA] New notification',
                  html: `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title || 'ARA Notification'}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f9fb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;line-height:1.6">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 32px;box-shadow:0 4px 16px rgba(0,0,0,.04)">
        <img src="https://lsjozpktmapfqxqyaarw.supabase.co/storage/v1/object/public/avatars/avatars/sample_font_logo.png" alt="ARA Logo" style="display:block;margin:0 auto 20px auto;width:80px;height:auto" />
        <h1 style="font-size:22px;font-weight:700;text-align:center;color:#111827;margin-bottom:8px">${title || 'New Notification'}</h1>
        <p style="font-size:15px;color:#374151;margin:10px 0;white-space:pre-wrap">${content}</p>
        <p style="font-size:12px;color:#6b7280;margin:10px 0">If you have any questions, feel free to reply to this email or use the inquiry feature on our website.</p>
      </div>
      <div style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px">© 2026 ARA — Dive into Korean. Made with 🌊</div>
    </div>
  </body>
</html>
`
                })
              });
            } catch (e) {
              console.error(`Failed to send email to ${p.email}:`, e);
            }
          })).catch(e => console.error('Bulk email error:', e));
        }
      }

      toast.success(`${targetUsers.length}명에게 알림 발송이 완료되었습니다.`);
      setTitle('');
      setContent('');
      setSelectedUsers([]);
      fetchHistory();
    } catch (error: unknown) {
      console.error('Send error:', error);
      toast.error('발송 중 오류가 발생했습니다: ' + getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col p-4 md:p-6 gap-6 overflow-y-auto">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="text-primary" /> 알림 발송 센터
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          전체 또는 특정 그룹의 사용자들에게 중요 알림과 이메일을 발송합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 발송 폼 */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              {/* 발송 대상 선택 */}
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users size={16} className="text-primary" /> 발송 대상
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: '전체 사용자', icon: Users },
                    { id: 'premium', label: '프리미엄', icon: ShieldCheck },
                    { id: 'subscribers', label: '구독자', icon: Megaphone },
                    { id: 'manual', label: '직접 지정', icon: Search },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setTargetType(type.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 ${
                        targetType === type.id 
                          ? 'bg-primary/5 border-primary text-primary' 
                          : 'bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      <type.icon size={20} />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>

                {targetType === 'manual' && (
                  <div className="space-y-3 pt-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input
                        type="text"
                        placeholder="닉네임으로 검색..."
                        value={searchNickname}
                        onChange={(e) => setSearchNickname(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="animate-spin text-primary" size={16} />
                        </div>
                      )}
                      
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleAddUser(user)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><User size={14} /></div>
                                )}
                              </div>
                              <span className="text-sm font-medium">{user.nickname}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 border border-dashed border-border rounded-xl min-h-[50px]">
                        {selectedUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-1.5 px-2 py-1 bg-background border border-border rounded-lg text-xs font-medium shadow-sm">
                            <span>{user.nickname}</span>
                            <button onClick={() => handleRemoveUser(user.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 발송 내용 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">이메일 제목 (선택)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="이메일 발송 시에만 사용됩니다."
                    className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">발송 내용</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="사용자에게 전달할 내용을 입력하세요."
                    rows={6}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>

              {/* 발송 방식 */}
              <div className="flex items-center gap-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sendTypes.inApp}
                    onChange={(e) => setSendTypes({ ...sendTypes, inApp: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Bell size={16} /> 인앱 알림
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sendTypes.email}
                    onChange={(e) => setSendTypes({ ...sendTypes, email: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Mail size={16} /> 이메일 발송
                  </span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-secondary/30 border-t border-border flex justify-end">
              <button
                onClick={handleSend}
                disabled={isSubmitting || !content.trim()}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none active:scale-95"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                알림 발송하기
              </button>
            </div>
          </div>
        </div>

        {/* 발송 내역 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History size={18} className="text-primary" /> 최근 발송 내역
            </h2>
          </div>
          
          <div className="bg-card border border-border rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
            {loadingHistory ? (
              <div className="p-12 text-center">
                <Loader2 className="animate-spin mx-auto text-muted-foreground" size={24} />
              </div>
            ) : history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary rounded text-[10px] font-bold text-muted-foreground">
                      <Clock size={10} /> {format(new Date(item.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Clock size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">최근 발송 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 발송 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">알림을 발송할까요?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {targetType === 'all' ? '전체 사용자' : 
                   targetType === 'premium' ? '프리미엄 사용자' :
                   targetType === 'subscribers' ? '구독자' : 
                   `${selectedUsers.length}명의 사용자`}에게 
                  알림이 즉시 발송됩니다.<br />발송 후에는 취소할 수 없습니다.
                </p>
              </div>
            </div>
            <div className="flex border-t border-border p-3 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={executeSend}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
              >
                발송 시작
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationCenter;
