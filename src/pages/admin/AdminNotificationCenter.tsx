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
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TargetUser {
  id: string | null; // user_id (Auth ID)
  profile_id: string | null; // profiles.id (UUID)
  nickname: string;
  email: string;
  avatar_url: string | null;
  plan?: string;
  marketing_opt_in?: boolean;
  is_waitlist?: boolean;
}

const AdminNotificationCenter = () => {
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'premium' | 'marketing' | 'waitlist' | 'manual'>('all');
  const [selectedUsers, setSelectedUsers] = useState<TargetUser[]>([]);
  const [sendTypes, setSendTypes] = useState({ inApp: true, email: false });
  
  // UI State
  const [searchNickname, setSearchNickname] = useState('');
  const [searchResults, setSearchResults] = useState<TargetUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allUsers, setAllUsers] = useState<TargetUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch History
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('type', 'updates')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

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
        const { data: waitlistData } = await (supabase as any).rpc('get_waitlist_with_profile');
        const waitlistEmails = new Set(((waitlistData as any[]) || []).map(w => w.email));

        const { data, error } = await (supabase
          .from('profiles') as any)
          .select('id, user_id, nickname, avatar_url, plan, marketing_opt_in')
          .ilike('nickname', `%${searchNickname}%`)
          .limit(10);

        if (error) throw error;
        
        const searchResultsWithEmail: TargetUser[] = await Promise.all(((data as any[]) || []).map(async (p: any) => {
          const { data: email } = await (supabase as any).rpc('get_user_email_admin', {
            p_user_id: p.user_id
          });
          return {
            id: p.user_id,
            profile_id: p.id,
            nickname: p.nickname,
            email: email || '',
            avatar_url: p.avatar_url,
            plan: p.plan,
            marketing_opt_in: p.marketing_opt_in,
            is_waitlist: waitlistEmails.has(email)
          };
        }));

        setSearchResults(searchResultsWithEmail);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchNickname, targetType]);

  // Fetch Users based on Target Type
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        let users: TargetUser[] = [];
        const { data: waitlistData } = await (supabase as any).rpc('get_waitlist_with_profile');
        const waitlistUsers = (waitlistData as any[]) || [];
        const waitlistEmails = new Set(waitlistUsers.map(w => w.email));

        if (targetType === 'waitlist') {
          users = waitlistUsers.map(w => ({
            id: w.user_id || null,
            profile_id: w.profile_id || null,
            nickname: w.nickname || w.email.split('@')[0],
            email: w.email,
            avatar_url: w.avatar_url || null,
            plan: w.plan,
            marketing_opt_in: w.marketing_opt_in,
            is_waitlist: true
          }));
        } else {
          let query = (supabase.from('profiles') as any).select('id, user_id, nickname, avatar_url, plan, marketing_opt_in');
          
          if (targetType === 'premium') query = query.eq('plan', 'premium');
          else if (targetType === 'marketing') query = query.eq('marketing_opt_in', true);
          else if (targetType === 'manual') query = query.order('nickname', { ascending: true }).limit(200);
          else if (targetType === 'all') query = query.limit(200);
          
          const { data, error } = await query;
          if (error) throw error;
          
          users = await Promise.all(((data as any[]) || []).map(async (p: any) => {
            const { data: email } = await (supabase as any).rpc('get_user_email_admin', {
              p_user_id: p.user_id
            });
            return {
              id: p.user_id,
              profile_id: p.id,
              nickname: p.nickname,
              email: email || '',
              avatar_url: p.avatar_url,
              plan: p.plan,
              marketing_opt_in: p.marketing_opt_in,
              is_waitlist: waitlistEmails.has(email)
            };
          }));
        }
        
        setAllUsers(users);
        if (targetType !== 'manual') setSelectedUsers(users);
        else setSelectedUsers([]);
      } catch (error) {
        console.error('Fetch users error:', error);
        toast.error('사용자 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [targetType]);

  const handleAddUser = (user: TargetUser) => {
    if (!selectedUsers.find(u => u.email === user.email)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchNickname('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userEmail: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.email !== userEmail));
  };

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error('내용을 입력해 주세요.');
      return;
    }
    if (selectedUsers.length === 0) {
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
      const targetUsers = selectedUsers;

      if (targetUsers.length === 0) {
        toast.error('발송 대상이 없습니다.');
        return;
      }

      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Admin session not found');

      const { data: adminProfile } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', adminUser.id)
        .maybeSingle();

      // 2. Send In-App Notifications
      if (sendTypes.inApp) {
        const inAppTargets = targetUsers.filter(u => u.profile_id);
        
        if (inAppTargets.length > 0) {
          const notifications = inAppTargets.map(profile => ({
            receiver_id: profile.profile_id,
            sender_id: adminProfile?.id,
            type: 'updates',
            content: content.trim(),
            is_read: false
          }));

          const BATCH_SIZE = 1000;
          for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
            const batch = notifications.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await (supabase
              .from('notifications') as any)
              .insert(batch);
            if (insertError) throw insertError;
          }
        }
      }

      // 3. Send Emails
      if (sendTypes.email) {
        if (targetUsers.length > 0) {
          Promise.all(targetUsers.map(async (p) => {
            if (!p.email) return;
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
        <p style="font-size:12px;color:#6b7280;margin:10px 0">If you have any questions, feel free to reply to this email or use the inquiry feature on our service.</p>
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
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users size={16} className="text-primary" /> 발송 대상
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { id: 'all', label: '전체 사용자', icon: Users },
                    { id: 'premium', label: '프리미엄', icon: ShieldCheck },
                    { id: 'marketing', label: '마케팅 동의', icon: Megaphone },
                    { id: 'waitlist', label: '업데이트 구독', icon: Mail },
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

                <div className="space-y-3 pt-2">
                  {targetType === 'manual' && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input
                        type="text"
                        placeholder="닉네임으로 검색..."
                        value={searchNickname}
                        onChange={(e) => setSearchNickname(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {(isSearching || isLoadingUsers) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="animate-spin text-primary" size={16} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-secondary/30 border border-border rounded-xl overflow-hidden">
                    <div className="p-3 bg-secondary/50 border-b border-border flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        {searchNickname ? '검색 결과' : '발송 대상 미리보기'} ({searchNickname ? searchResults.length : allUsers.length}명)
                      </span>
                      {targetType !== 'manual' && (
                        <span className="text-[10px] text-muted-foreground">목록에서 체크 해제 시 발송 제외</span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                      {(searchNickname ? searchResults : allUsers).length > 0 ? (
                        <div className="divide-y divide-border/50">
                          {(searchNickname ? searchResults : allUsers).map((user) => {
                            const isSelected = selectedUsers.some(u => u.email === user.email);
                            return (
                              <button
                                key={user.email}
                                onClick={() => isSelected ? handleRemoveUser(user.email) : handleAddUser(user)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary transition-colors text-left group"
                              >
                                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-primary border-primary' : 'bg-background border-border group-hover:border-primary/60'
                                }`}>
                                  {isSelected && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>

                                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0 border border-border">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-background text-muted-foreground"><User size={14} /></div>
                                  )}
                                </div>
                                
                                <div className="flex-1 flex items-center justify-between min-w-0">
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium truncate">{user.nickname}</span>
                                      {user.plan && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                          user.plan === 'premium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                          user.plan === 'basic' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                          {user.plan}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {user.marketing_opt_in && (
                                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-[10px] font-bold">
                                        마케팅 동의
                                      </span>
                                    )}
                                    {user.is_waitlist && (
                                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[10px] font-bold">
                                        업데이트 구독
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          {(isSearching || isLoadingUsers) ? '데이터를 불러오는 중...' : (searchNickname ? '검색 결과가 없습니다.' : '사용자 목록이 비어 있습니다.')}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 border border-dashed border-border rounded-xl min-h-[50px]">
                      <div className="w-full mb-1 text-[10px] font-bold text-muted-foreground uppercase">발송 대상 확정 ({selectedUsers.length}명)</div>
                      {selectedUsers.map((user) => (
                        <div key={user.email} className="flex items-center gap-1.5 px-2 py-1 bg-background border border-border rounded-lg text-xs font-medium shadow-sm">
                          <span>{user.nickname}</span>
                          <button onClick={() => handleRemoveUser(user.email)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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

              <div className="flex items-center gap-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sendTypes.inApp}
                      onChange={(e) => setSendTypes({ ...sendTypes, inApp: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                      sendTypes.inApp 
                        ? 'bg-primary border-primary' 
                        : 'bg-transparent border-border hover:border-primary/60'
                    }`}>
                      {sendTypes.inApp && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Bell size={16} /> 인앱 알림
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sendTypes.email}
                      onChange={(e) => setSendTypes({ ...sendTypes, email: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                      sendTypes.email 
                        ? 'bg-primary border-primary' 
                        : 'bg-transparent border-border hover:border-primary/60'
                    }`}>
                      {sendTypes.email && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
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
                   targetType === 'marketing' ? '마케팅 동의 사용자' :
                   targetType === 'waitlist' ? '업데이트 구독자' :
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
