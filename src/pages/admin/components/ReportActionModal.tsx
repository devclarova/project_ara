import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/common/Modal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { addDays, addYears } from 'date-fns';
import { formatRelativeTime } from '@/utils/dateUtils';
import { getErrorMessage } from '@/utils/errorMessage';
import { 
  MessageSquare, 
  Heart, 
  Repeat, 
  Share, 
  User, 
  Calendar, 
  MapPin, 
  Link as LinkIcon,
  AlertTriangle,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Ban,
  Trash2,
  CheckCircle,
  XOctagon,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ProfileTabs, { type ProfileTabKey } from '@/pages/profile/components/ProfileTabs';
import ProfileTweets from '@/pages/profile/components/ProfileTweets';
import ProfileHeader from '@/pages/profile/components/ProfileHeader';
import TweetCard from '@/pages/community/feature/TweetCard';
import { ReplyCard } from '@/pages/community/tweet/components/ReplyCard';
import ReplyList from '@/pages/community/tweet/components/ReplyList';
import type { FeedItem, UIReply } from '@/types/sns';
import { tweetService } from '@/services/tweetService';

interface Report {
  id: string;
  target_type: 'tweet' | 'reply' | 'user' | 'chat';
  target_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'reviewed';
  reporter?: {
    nickname: string;
    avatar_url: string;
    user_id: string;
  };
  created_at: string;
  metadata?: {
    reported_message_ids?: string[];
  };
}

interface ReportActionModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: () => void;
}

interface AdminProfile {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  email: string | null;
  country: string | null;
  countryName?: string | null;
  countryFlagUrl?: string | null;
  gender?: string | null;
  birthday?: string | null;
  is_admin?: boolean;
}

type ReportTarget = 
  | (import('@/types/database').Database['public']['Tables']['tweets']['Row'] & { profiles: AdminProfile; countryName?: string | null; countryFlagUrl?: string | null; is_hidden?: boolean })
  | (import('@/types/database').Database['public']['Tables']['tweet_replies']['Row'] & { profiles: AdminProfile; countryName?: string | null; countryFlagUrl?: string | null; is_hidden?: boolean; tweet_id: string })
  | (AdminProfile & { id: string; user_id: string; countryName?: string | null; countryFlagUrl?: string | null })
  | (import('@/types/database').Database['public']['Tables']['direct_chats']['Row'] & { sender?: AdminProfile; countryName?: string | null; countryFlagUrl?: string | null; is_hidden?: boolean });

type ReportedChatMessage = import('@/types/database').Database['public']['Tables']['direct_messages']['Row'] & {
  attachments: any[];
  sender?: AdminProfile;
};

// Report Context Type (Parent tweet or Chat history)
type ReportActionContext = ReportTarget | ReportedChatMessage[] | null;

export default function ReportActionModal({ report, isOpen, onClose, onResolve }: ReportActionModalProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [targetData, setTargetData] = useState<ReportTarget | null>(null);
  const [contextData, setContextData] = useState<ReportActionContext>(null);
  const [activeUserTab, setActiveUserTab] = useState<ProfileTabKey>('posts');
  const [detailStack, setDetailStack] = useState<FeedItem[]>([]);
  const [replies, setReplies] = useState<UIReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banDuration, setBanDuration] = useState<number | 'permanent' | 'custom'>(1);
  const [customDays, setCustomDays] = useState<string>('');

  const [isBanProcessing, setIsBanProcessing] = useState(false);
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const activitySectionRef = useRef<HTMLDivElement>(null);

  // Chat Report State
  const [chatHasMore, setChatHasMore] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [reportedMessages, setReportedMessages] = useState<ReportedChatMessage[]>([]);
  const [showFullChat, setShowFullChat] = useState(false);
  const [fullChatMessages, setFullChatMessages] = useState<ReportedChatMessage[]>([]);

  const loadMoreChat = async () => {
      if (!targetData?.id || isChatLoading || !(contextData as any)?.length) return;
      setIsChatLoading(true);
      
      const oldestMsg = (contextData as any)[0];
      const { data: moreMsgs } = await (supabase.from('direct_messages') as any)
          .select('*')
          .eq('chat_id', targetData.id)
          .lt('created_at', oldestMsg.created_at)
          .order('created_at', { ascending: false })
          .limit(50);
          
      if (moreMsgs && moreMsgs.length > 0) {
           const senderIds = Array.from(new Set(moreMsgs.map((m: any) => m.sender_id)));
           const { data: profiles } = await (supabase.from('profiles') as any).select('*').in('user_id', senderIds);
           const msgsWithSender = moreMsgs.map((m: any) => ({...m, sender: profiles?.find((p: any) => p.user_id === m.sender_id)})).reverse();
           
           setContextData((prev) => {
               if (Array.isArray(prev)) return [...msgsWithSender, ...prev];
               return msgsWithSender;
           });
           setChatHasMore(moreMsgs.length === 50);
      } else {
           setChatHasMore(false);
      }
      setIsChatLoading(false);
  };

  useEffect(() => {
    if (detailStack.length > 0) {
        const item = detailStack[detailStack.length - 1];
        if (item.type !== 'reply') {
            setRepliesLoading(true);
            tweetService.getRepliesByTweetId(item.id, 0, true)
                .then(data => setReplies(data))
                .catch(err => console.error('Failed to load replies', err))
                .finally(() => setRepliesLoading(false));
        } else {
            setReplies([]);
        }
    } else {
        setReplies([]);
    }
  }, [detailStack]);

  useEffect(() => {
    if (detailStack.length > 0 && activitySectionRef.current) {
      activitySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [detailStack.length]);

  useEffect(() => {
    if (isOpen && report) {
      fetchTargetData();
    } else {
      setTargetData(null);
      setContextData(null);
      setActiveUserTab('posts');
      setDetailStack([]);
      setReportedMessages([]);
    }
  }, [isOpen, report]);

  const [fetchedReporter, setFetchedReporter] = useState<AdminProfile | null>(null);

  const fetchTargetData = async () => {
    if (!report) return;
    setLoading(true);
    try {
      let fetchedProfile = null;
      
      if (report.reporter?.user_id) {
          const { data: reporterData } = await (supabase.from('profiles') as any).select('*').eq('user_id', report.reporter.user_id).maybeSingle();
          if (reporterData) {
              let rCountryName = reporterData.country;
              let rCountryFlagUrl = null;
              if (reporterData.country) {
                   const { data: cRow } = await (supabase.from('countries') as any).select('name, flag_url').eq('id', reporterData.country).maybeSingle();
                   if (cRow) {
                       rCountryName = cRow.name;
                       rCountryFlagUrl = cRow.flag_url;
                   }
              }
              setFetchedReporter({ ...reporterData, countryName: rCountryName, countryFlagUrl: rCountryFlagUrl });
          }
      }

      if (report.target_type === 'tweet') {
        const { data } = await (supabase.from('tweets') as any).select('*, profiles(*)').eq('id', report.target_id).maybeSingle();
        setTargetData(data);
        fetchedProfile = data?.profiles;
      } else if (report.target_type === 'reply') {
        const { data: reply, error: replyError } = await (supabase.from('tweet_replies') as any).select('*, profiles(*)').eq('id', report.target_id).maybeSingle();
        
        if (replyError) {
             setTargetData(null);
        } else {
             setTargetData(reply);
             fetchedProfile = reply?.profiles;
             if (reply?.tweet_id) {
                const { data: parent } = await (supabase.from('tweets') as any).select('*, profiles(*)').eq('id', reply.tweet_id).maybeSingle();
                setContextData(parent);
             }
        }
      } else if (report.target_type === 'user') {
        const { data: profile } = await (supabase.from('profiles') as any).select('*').eq('id', report.target_id).maybeSingle();
        setTargetData(profile);
        fetchedProfile = profile;
      } else if (report.target_type === 'chat') {
         const { data: room, error: roomError } = await (supabase.from('direct_chats') as any).select('*').eq('id', report.target_id).maybeSingle();
         
         if (room) {
             const reporterAuthId = report.reporter?.user_id;
             const { data: reporterProfile } = await (supabase.from('profiles') as any)
                 .select('id')
                 .eq('user_id', reporterAuthId)
                 .maybeSingle();
             
             const reporterProfileId = reporterProfile?.id;
             const suspectProfileId = room.user1_id === reporterProfileId ? room.user2_id : room.user1_id;
             const { data: suspectProfile } = await (supabase.from('profiles') as any).select('*').eq('id', suspectProfileId).maybeSingle();

             let countryName = suspectProfile?.country;
             let countryFlagUrl = null;
             if (suspectProfile?.country) {
                 const { data: countryRow } = await (supabase.from('countries') as any).select('name, flag_url').eq('id', suspectProfile.country).maybeSingle();
                 if (countryRow) {
                     countryName = countryRow.name;
                     countryFlagUrl = countryRow.flag_url;
                 }
             }

             setTargetData({ ...room, sender: suspectProfile, countryName, countryFlagUrl });
             
             const { data: messages } = await (supabase.from('direct_messages') as any)
                .select('*, attachments:direct_message_attachments(*)')
                .eq('chat_id', room.id)
                .order('created_at', { ascending: false }) 
                .limit(50);

             if (report.metadata?.reported_message_ids && report.metadata.reported_message_ids.length > 0) {
                 const { data: reportedMsgs } = await (supabase.from('direct_messages') as any)
                    .select('*, attachments:direct_message_attachments(*)')
                    .in('id', report.metadata.reported_message_ids);
                 
                 if (reportedMsgs && reportedMsgs.length > 0) {
                     const rSenderIds = Array.from(new Set(reportedMsgs.map((m: any) => m.sender_id)));
                     const { data: rProfiles } = await (supabase.from('profiles') as any).select('*').in('user_id', rSenderIds);
                     const enrichedReportedMsgs = reportedMsgs.map((m: any) => ({
                         ...m,
                         sender: rProfiles?.find((p: any) => p.user_id === m.sender_id)
                     })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                     setReportedMessages(enrichedReportedMsgs);
                 }
             }

             if (messages && messages.length > 0) {
                 const senderIds = Array.from(new Set(messages.map((m: any) => m.sender_id)));
                 const { data: profiles } = await (supabase.from('profiles') as any).select('*').in('user_id', senderIds);
                 
                 const messagesWithSenders = messages.map((m: any) => ({
                     ...m,
                     sender: profiles?.find((p: any) => p.user_id === m.sender_id)
                 })).reverse();
                 
                 setContextData(messagesWithSenders);
                 setChatHasMore(messages.length === 50);
             } else {
                 setContextData([]);
                 setChatHasMore(false);
             }
         } else {
             setTargetData(null);
         }
       }

      if (fetchedProfile) {
        let countryName = fetchedProfile.country;
        let countryFlagUrl = null;
        
        if (fetchedProfile.country) {
             const { data: countryRow } = await (supabase.from('countries') as any).select('name, flag_url').eq('id', fetchedProfile.country).maybeSingle();
             if (countryRow) {
                 countryName = countryRow.name;
                 countryFlagUrl = countryRow.flag_url;
             }
        }
        
        setTargetData((prev) => prev ? ({ ...prev, countryName, countryFlagUrl }) : null);
      }
    } catch (error: unknown) {
      console.error('Error fetching target data:', getErrorMessage(error));
      toast.error('상세 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = async (replyId: string, tweetId: string) => {
    try {
      const { data: tweet, error } = await (supabase.from('tweets') as any)
        .select('*, profiles(*)')
        .eq('id', tweetId)
        .maybeSingle();
      
      if (error || !tweet) {
        toast.error('원본 게시글을 불러올 수 없습니다.');
        return;
      }

      const feedItem = {
        id: tweet.id,
        type: 'tweet' as const,
        user: {
          id: tweet.profiles?.id || '00000000-0000-0000-0000-000000000000',
          name: tweet.profiles?.nickname || 'Unknown',
          username: tweet.profiles?.user_id || 'unknown',
          avatar: tweet.profiles?.avatar_url || ''
        },
        content: tweet.content,
        timestamp: tweet.created_at,
        createdAt: tweet.created_at,
        stats: {
          likes: tweet.like_count || 0,
          replies: tweet.reply_count || 0,
          retweets: 0,
          views: tweet.view_count || 0
        },
        image: tweet.image_urls
      };

      setDetailStack(prev => [...prev, feedItem]);
    } catch (error: unknown) {
      console.error('Error loading parent tweet:', getErrorMessage(error));
      toast.error('게시글 로드 실패');
    }
  };

  const handleAction = async (action: 'dismiss' | 'delete' | 'ban' | 'toggle_hide') => {
    if (!report) return;

    if (action === 'ban') {
       setBanDuration(1);
       setCustomDays('');
       setShowBanDialog(true);
       return; 
    }
    
    if (action === 'dismiss') {
        setShowDismissDialog(true);
        return;
    }

    if (action === 'delete') {
         setShowDeleteDialog(true);
    }
    
    if (action === 'toggle_hide') {
        setShowHideDialog(true);
    }
  };

  const executeDismiss = async () => {
      if (!report) return;
      try {
          await (supabase.from('reports') as any).update({ status: 'dismissed' }).eq('id', report.id);
          toast.success('신고가 기각되었습니다.');
          onResolve();
          onClose();
      } catch (error: unknown) {
          console.error('Dismiss report error:', getErrorMessage(error));
          toast.error('작업 수행 실패');
      } finally {
          setShowDismissDialog(false);
      }
  };

  const executeDelete = async () => {
      if (!report) return;
      try {
        if (report.target_type === 'tweet') {
            await (supabase.from('tweets') as any).update({ deleted_at: new Date().toISOString() }).eq('id', report.target_id);
        } else if (report.target_type === 'reply') {
            await (supabase.from('tweet_replies') as any).update({ deleted_at: new Date().toISOString() }).eq('id', report.target_id);
        } else if (report.target_type === 'chat') {
            await (supabase.from('direct_messages') as any).update({ deleted_at: new Date().toISOString() }).eq('id', report.target_id);
        }
        await (supabase.from('reports') as any).update({ status: 'resolved' }).eq('id', report.id);
        toast.success('콘텐츠 삭제 및 신고 처리가 완료되었습니다.');
        
        onResolve();
        onClose();
      } catch (error: unknown) {
          console.error('Delete content error:', getErrorMessage(error));
          toast.error('작업 수행 실패');
      }
  };

  const executeToggleHide = async () => {
    if (!report || !targetData) return;
    try {
      const currentHidden = !!(targetData as any)?.is_hidden;
      const newHidden = !currentHidden;
      
      const { error } = await (supabase as any).rpc('toggle_content_hidden', {
        p_type: report.target_type === 'tweet' ? 'post' : report.target_type === 'reply' ? 'comment' : 'message',
        p_id: report.target_id,
        p_hidden: newHidden
      });

      if (error) throw error;

      if (report.status === 'pending') {
        await (supabase.from('reports') as any).update({ status: 'reviewed' }).eq('id', report.id);
      }

      toast.success(newHidden ? '콘텐츠가 숨김 처리되었습니다.' : '숨김 처리가 해제되었습니다.');
      
      setTargetData((prev) => prev ? ({ ...prev, is_hidden: newHidden } as any) : null);
      setShowHideDialog(false);
      onResolve();
    } catch (error: unknown) {
      console.error('Toggle hide error:', getErrorMessage(error));
      toast.error('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const executeBan = async () => {
      if (!report) return;
      setIsBanProcessing(true);
      try {
          let until: string;
          if (banDuration === 'permanent') {
              until = addYears(new Date(), 100).toISOString();
          } else if (banDuration === 'custom') {
              const days = parseInt(customDays);
              if (isNaN(days) || days <= 0) {
                  toast.error('유효한 제재 기간을 입력해주세요.');
                  setIsBanProcessing(false);
                  return;
              }
              until = addDays(new Date(), days).toISOString();
          } else {
              until = addDays(new Date(), banDuration).toISOString();
          }
          
          const target = targetData as (ReportTarget & { profiles?: AdminProfile });
          if (target?.profiles?.id) {
              await (supabase.from('profiles') as any).update({ banned_until: until }).eq('id', target.profiles.id);
          } else if (targetData && 'sender' in targetData && targetData.sender?.id) {
              await (supabase.from('profiles') as any).update({ banned_until: until }).eq('id', targetData.sender.id);
          } else {
              toast.error('사용자 정보를 찾을 수 없어 제재할 수 없습니다.');
              setIsBanProcessing(false);
              return;
          }

          await (supabase.from('reports') as any).update({ status: 'resolved' }).eq('id', report.id);
          const durationText = banDuration === 'permanent' ? '영구' : banDuration === 'custom' ? `${customDays}일` : `${banDuration}일`;
          toast.success(`사용자를 ${durationText}간 정지했습니다.`);
          
          setShowBanDialog(false);
          onResolve();
          onClose();
      } catch (err: unknown) {
          console.error(err);
          toast.error('제재 처리 실패: ' + (err as Error).message);
      } finally {
          setIsBanProcessing(false);
      }
  };

  if (!report) return null;

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="신고 상세 내역" 
        className="max-w-4xl h-[80vh] p-0 overflow-hidden" 
        headerClassName="py-4"
        contentClassName="!overflow-hidden flex flex-col"
    >
      {/* Ban Duration Dialog */}
      {showBanDialog && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Ban className="text-primary" /> 사용자 제재 설정
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">제재 기간을 선택하세요. 기간 동안 해당 사용자는 활동이 제한됩니다.</p>
                  
                  <div className="space-y-2 mb-6">
                      {[1, 3, 5, 7, 30].map(days => (
                          <label 
                            key={days} 
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                                banDuration === days 
                                ? 'border-primary ring-1 ring-primary bg-primary/5' 
                                : 'hover:bg-gray-50 dark:hover:bg-white/5 border-border'
                            }`}
                          >
                              <div className="relative flex items-center justify-center w-4 h-4">
                                  <input 
                                      type="radio" 
                                      name="banDuration" 
                                      value={days} 
                                      checked={banDuration === days}
                                      onChange={() => setBanDuration(days)}
                                      className="appearance-none peer w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 checked:border-primary bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer !shadow-none !p-0"
                                  />
                                  <div className="absolute w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                              </div>
                              <span className="font-medium">{days}일 정지</span>
                          </label>
                      ))}
                      <label 
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition mb-2 ${
                            banDuration === 'custom'
                            ? 'border-primary ring-1 ring-primary bg-primary/5'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5 border-border'
                        }`}
                      >
                           <div className="relative flex items-center justify-center w-4 h-4">
                               <input 
                                   type="radio" 
                                   name="banDuration" 
                                   value="custom"
                                   checked={banDuration === 'custom'}
                                   onChange={() => setBanDuration('custom')}
                                   className="appearance-none peer w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 checked:border-primary bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer !shadow-none !p-0"
                               />
                               <div className="absolute w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                           </div>
                           <span className="font-medium">직접 입력 (일 단위)</span>
                      </label>
                      
                       <AnimatePresence>
                           {banDuration === 'custom' && (
                               <motion.div
                                   initial={{ height: 0, opacity: 0 }}
                                   animate={{ height: 'auto', opacity: 1 }}
                                   exit={{ height: 0, opacity: 0 }}
                                   transition={{ duration: 0.2 }}
                                   className="overflow-hidden ml-7 mb-2"
                               >
                                   <input 
                                       type="number" 
                                       value={customDays}
                                       onChange={(e) => setCustomDays(e.target.value)}
                                       placeholder="일 수 입력 (예: 14)"
                                       className="w-full p-2 border rounded-md text-sm dark:bg-zinc-800 dark:border-zinc-700"
                                       min="1"
                                   />
                               </motion.div>
                           )}
                       </AnimatePresence>

                      <label 
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                            banDuration === 'permanent'
                            ? 'border-primary ring-1 ring-primary bg-primary/5'
                             : 'hover:bg-primary/5 dark:hover:bg-primary/5 border-primary/20 dark:border-primary/20'
                        }`}
                      >
                             <div className="relative flex items-center justify-center w-4 h-4">
                                 <input 
                                    type="radio" 
                                    name="banDuration" 
                                    value="permanent" 
                                    checked={banDuration === 'permanent'}
                                    onChange={() => setBanDuration('permanent')}
                                    className="appearance-none peer w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 checked:border-primary bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer !shadow-none !p-0"
                                />
                                <div className="absolute w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                             </div>
                            <span className="font-bold text-primary dark:text-primary">영구 정지</span>
                      </label>
                  </div>

                  <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setShowBanDialog(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            취소
                        </button>
                        <button 
                            onClick={executeBan}
                            disabled={isBanProcessing}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-sm disabled:opacity-50"
                        >
                            {isBanProcessing ? '처리 중...' : '제재 적용'}
                        </button>
                  </div>
              </div>

          </div>
      )}

      {/* Dismiss Confirmation Dialog */}
      {showDismissDialog && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      <Shield className="text-gray-500" /> 신고 기각
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                      해당 신고를 기각하시겠습니까? <br/>
                      기각된 신고는 '기각됨' 상태로 변경되며, 별도의 제재 조치가 이루어지지 않습니다.
                  </p>

                  <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setShowDismissDialog(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            취소
                        </button>
                        <button 
                            onClick={executeDismiss}
                            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg text-sm font-bold shadow-sm"
                        >
                            신고 기각
                        </button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      <Trash2 className="text-red-500" /> 콘텐츠 삭제
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                      해당 콘텐츠를 삭제하시겠습니까? <br/>
                      삭제된 콘텐츠는 복구할 수 없으며, 사용자에게는 '삭제됨'으로 표시됩니다.
                  </p>

                  <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setShowDeleteDialog(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            취소
                        </button>
                        <button 
                            onClick={async () => {
                                await executeDelete();
                                setShowDeleteDialog(false);
                            }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
                        >
                            삭제
                        </button>
                  </div>
              </div>
          </div>
      )}

      {/* Hide Confirmation Dialog */}
      {showHideDialog && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      {(targetData as any)?.is_hidden ? <Eye className="text-blue-500" /> : <XOctagon className="text-amber-500" />}
                      {(targetData as any)?.is_hidden ? '숨김 해제' : '콘텐츠 숨기기'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                      {(targetData as any)?.is_hidden 
                        ? '숨겨진 콘텐츠를 다시 공개하시겠습니까? 일반 사용자들에게도 다시 노출됩니다.' 
                        : '해당 콘텐츠를 숨기시겠습니까? 일반 사용자들에게는 안내 문구가 표시되며 실제 내용은 가려집니다.'}
                  </p>

                  <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setShowHideDialog(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            취소
                        </button>
                        <button 
                            onClick={executeToggleHide}
                            className={`px-4 py-2 ${(targetData as any)?.is_hidden ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded-lg text-sm font-bold shadow-sm`}
                        >
                            {(targetData as any)?.is_hidden ? '공개하기' : '숨기기'}
                        </button>
                  </div>
              </div>
          </div>
      )}


      <div className="flex flex-col md:flex-row h-full overflow-hidden bg-background">
        
        {/* LEFT PANEL: Metadata */}
        <div className="w-full h-[40%] md:h-full md:w-1/3 bg-secondary/50 p-6 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
          <div className="space-y-6">
            
            {/* Status & Type */}
            <div className="flex items-center gap-2">
               <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                 <AlertTriangle size={12} />
                 {report.status === 'pending' ? '대기 중' : 
                  report.status === 'resolved' ? '처리됨' : 
                  report.status === 'dismissed' ? '기각됨' : report.status}
               </span>
               <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                 {report.target_type === 'tweet' ? '트윗' :
                  report.target_type === 'reply' ? '답글' :
                  report.target_type === 'user' ? '사용자' :
                  report.target_type === 'chat' ? '채팅' : report.target_type}
               </span>
            </div>

            {/* Reason */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">신고 사유</h4>
                <p className="text-lg font-semibold text-foreground mb-1 capitalize">
                    {t(`report.reasons.${report.reason}`, report.reason)}
                </p>
                {report.description && (
                    <p className="text-sm text-muted-foreground bg-secondary p-2 rounded-lg italic">
                        "{report.description}"
                    </p>
                )}
            </div>

            {/* Reporter Info -> Reporter & Target Info */}
            <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">신고 당사자 정보</h4>
                <div className="flex flex-col gap-3">
                    {/* Reporter */}
                    <div 
                        onClick={() => {
                            if (fetchedReporter) {
                                setDetailStack(prev => [...prev, { 
                                    ...fetchedReporter, 
                                    id: fetchedReporter.id, 
                                    type: 'user',
                                } as any]);
                            }
                        }}
                        className={`flex items-center gap-3 bg-background border border-border rounded-xl p-3 relative ${fetchedReporter ? 'cursor-pointer hover:bg-secondary/50 transition-colors group' : ''}`}
                    >
                        <div className="shrink-0 flex items-center justify-center w-8 text-muted-foreground">
                             <span className="text-xs font-bold">FROM</span>
                        </div>
                        <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={report.reporter?.avatar_url || undefined} />
                            <AvatarFallback>R</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground font-bold uppercase mb-0.5">신고자</p>
                                {fetchedReporter && <i className="ri-external-link-line text-xs opacity-0 group-hover:opacity-50 transition-opacity" />}
                            </div>
                            <p className="text-sm font-bold truncate">{report.reporter?.nickname || 'Unknown'}</p>
                            
                            {/* Detailed Info (Age, Gender, Country) */}
                            {(fetchedReporter?.countryName || fetchedReporter?.gender || fetchedReporter?.birthday) && (
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                    {fetchedReporter.countryFlagUrl && (
                                        <span className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                                            <img src={fetchedReporter.countryFlagUrl ?? undefined} alt={fetchedReporter.countryName ?? undefined} className="w-3.5 h-3.5 rounded-full object-cover" />
                                            <span>{fetchedReporter.countryName}</span>
                                        </span>
                                    )}
                                    {fetchedReporter.gender && (
                                        <span className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                                            <i className={`ri-${fetchedReporter.gender === 'Male' ? 'men' : 'women'}-line`} />
                                            <span>{fetchedReporter.gender === 'Male' ? t('signup.gender_male', '남성') : t('signup.gender_female', '여성')}</span>
                                        </span>
                                    )}
                                    {fetchedReporter.birthday && (
                                        <span className="bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                                            {new Date().getFullYear() - new Date(fetchedReporter.birthday).getFullYear()}세
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center text-muted-foreground/50">
                        <ArrowRight size={16} className="rotate-90" />
                    </div>

                    {/* Reported User */}
                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-3">
                         <div className="shrink-0 flex items-center justify-center w-8 text-red-500 dark:text-red-400">
                             <span className="text-xs font-bold">TO</span>
                        </div>
                        <Avatar className="w-10 h-10 border border-border">
                             <AvatarImage src={(targetData as any)?.profiles?.avatar_url || (targetData as any)?.sender?.avatar_url || (targetData as any)?.avatar_url || undefined} />
                             <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-red-500 dark:text-red-400 font-bold uppercase mb-0.5">대상자 (피신고자)</p>
                            <p className="text-sm font-bold truncate">
                                {(targetData as any)?.profiles?.nickname || (targetData as any)?.sender?.nickname || (targetData as any)?.nickname || 'Loading...'}
                            </p>

                            {/* Detailed Info (Age, Gender, Country) */}
                            {(() => {
                                const profile = report.target_type === 'user' ? (targetData as any) : 
                                              report.target_type === 'chat' ? (targetData as any)?.sender : 
                                              (targetData as any)?.profiles;
                                
                                return profile ? (
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                        {targetData?.countryFlagUrl && (
                                            <span className="flex items-center gap-1 bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                                                <img src={targetData.countryFlagUrl ?? undefined} alt={targetData.countryName ?? undefined} className="w-3.5 h-3.5 rounded-full object-cover" />
                                                <span>{targetData.countryName}</span>
                                            </span>
                                        )}
                                        {profile.gender && (
                                            <span className="flex items-center gap-1 bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                                                <i className={`ri-${profile.gender === 'Male' ? 'men' : 'women'}-line`} />
                                                <span>{profile.gender === 'Male' ? t('signup.gender_male', '남성') : t('signup.gender_female', '여성')}</span>
                                            </span>
                                        )}
                                        {profile.birthday && (
                                            <span className="bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                                                {new Date().getFullYear() - new Date(profile.birthday).getFullYear()}세
                                            </span>
                                        )}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={14} />
                <span>
                    {new Date(report.created_at).toLocaleString('ko-KR')} 
                    ({formatRelativeTime(report.created_at)})
                </span>
            </div>

            {/* Actions Panel (Left Side on Desktop) */}
            <div className="space-y-2 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">관리자 조치</h4>
                <button 
                    onClick={() => handleAction('dismiss')}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-border hover:bg-secondary transition text-sm font-medium"
                >
                    <Shield size={16} /> 신고 기각
                </button>
                {(report.target_type === 'tweet' || report.target_type === 'reply' || report.target_type === 'chat') && (
                    <>
                        <button 
                            onClick={() => handleAction('toggle_hide' as 'dismiss' | 'toggle_hide' | 'delete' | 'ban')}
                            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 ${
                                (targetData as any)?.is_hidden 
                                ? 'border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100' 
                                : 'border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100'
                            } transition text-sm font-bold shadow-sm`}
                        >
                            {(targetData as any)?.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            {(targetData as any)?.is_hidden ? '숨기기 해제' : '콘텐츠 숨기기'}
                        </button>
                        
                        <button 
                            onClick={() => handleAction('delete')}
                            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm font-medium shadow-sm"
                        >
                            <Trash2 size={16} /> 콘텐츠 삭제
                        </button>
                    </>
                )}
                <button 
                     onClick={() => handleAction('ban')}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90 transition text-sm font-medium shadow-sm"
                >
                    <Ban size={16} /> 사용자 제재
                </button>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Content Preview */}
        <div className="w-full h-[60%] md:h-full md:w-2/3 flex flex-col p-0 bg-gray-50 dark:bg-black/20 overflow-hidden">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p>상세 정보 불러오는 중...</p>
                </div>
            ) : !targetData ? (
                 <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <XOctagon size={48} className="mb-4 text-gray-300" />
                    <p>콘텐츠를 찾을 수 없거나 삭제되었습니다.</p>
                </div>
            ) : detailStack.length > 0 ? (
                /* DETAIL VIEW STACK */
                <div className="h-full flex flex-col bg-white dark:bg-gray-900 absolute inset-0 z-20 md:static">
                    <div className="shrink-0 bg-white dark:bg-gray-900 border-b border-border p-3 flex items-center gap-2">
                            <button 
                            onClick={() => setDetailStack(prev => prev.slice(0, -1))}
                            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            <ChevronLeft size={18} /> 
                            {detailStack.length > 1 ? '뒤로' : '신고 내역으로'}
                        </button>
                        <span className="text-xs text-muted-foreground ml-auto">상세 보기</span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black/20 p-4">
                            {(() => {
                            const item = detailStack[detailStack.length - 1];
                            
                            // Handle User Profile View
                            if ('type' in item && (item as unknown as { type: string }).type === 'user') {
                                const p = item as unknown as (AdminProfile & { followers_count?: number; following_count?: number; banner_url?: string; banner_position_y?: number; bio?: string; created_at?: string }); 
                                // Fallback objects for profile headers
                                const userP = {
                                    id: p.id,
                                    user_id: p.user_id,
                                    name: p.nickname,
                                    username: p.user_id,
                                    avatar: p.avatar_url || '',
                                    bio: p.bio || '',
                                    joinDate: (p as any).created_at ? new Date((p as any).created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
                                    followers: p.followers_count || 0,
                                    following: p.following_count || 0,
                                    banner: p.banner_url,
                                    bannerPositionY: p.banner_position_y,
                                    country: p.countryName || p.country, // Ensure name is passed
                                    countryFlagUrl: p.countryFlagUrl,
                                    gender: p.gender,
                                    age: p.birthday ? (new Date().getFullYear() - new Date(p.birthday).getFullYear()) : null,
                                };

                                return (
                                    <div className="h-full">
                                        <div className="mb-4">
                                            <ProfileHeader 
                                                userProfile={userP}
                                                isOwnProfile={false}
                                                hideFollowButton={true}
                                                showPersonalDetails={true}
                                            />
                                        </div>
                                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border">
                                                <div className="p-0">
                                                    <ProfileTabs activeTab={activeUserTab} onTabChange={setActiveUserTab} />
                                                    <div className="p-0 min-h-[200px]">
                                                        <ProfileTweets 
                                                        activeTab={activeUserTab} 
                                                        userProfile={userP} 
                                                        disableInteractions={true}
                                                        onItemClick={async (item) => {
                                                            if (item.type === 'reply' && (item as unknown as { tweetId: string }).tweetId) {
                                                                await handleReplyClick((item as unknown as { id: string }).id, (item as unknown as { tweetId: string }).tweetId);
                                                            } else {
                                                                setDetailStack(prev => [...prev, item]);
                                                            }
                                                        }}
                                                        />
                                                    </div>
                                                </div>
                                        </div>
                                    </div>
                                );
                            }

                                return item.type === 'reply' ? (
                                    <div className="max-w-2xl mx-auto">
                                    <ReplyCard 
                                        key={'detail-' + item.id}
                                        reply={{
                                            ...item,
                                            timestamp: item.timestamp || (item as unknown as { created_at: string }).created_at || item.createdAt || ''
                                        } as UIReply}
                                        highlight={false}
                                        disableInteractions={true}
                                        onClick={(id, tid) => { setDetailStack(prev => [...prev, { ...item, type: 'reply' } as unknown as FeedItem]); }} 
                                    />
                                    </div>
                                ) : (
                                    <div className="max-w-2xl mx-auto pb-10">
                                        <TweetCard 
                                            key={'detail-' + item.id}
                                            {...item} 
                                            user={item.user || { name: 'Unknown', username: 'unknown', avatar: '' }} 
                                            onClick={(id) => { console.log('Already deep', id); }}
                                            disableInteractions={true}
                                        />
                                        
                                        {/* REPLIES SECTION */}
                                        <div className="mt-4 border-t border-border pt-4">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 px-2">
                                                댓글 {replies.length}
                                            </h4>
                                            
                                            {repliesLoading ? (
                                                <div className="flex justify-center py-8">
                                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            ) : replies.length > 0 ? (
                                                <div className="space-y-4">
                                                    {replies.map(reply => (
                                                        <ReplyCard 
                                                            key={reply.id}
                                                            reply={reply}
                                                            highlight={false}
                                                            disableInteractions={true}
                                                            onClick={(id, tid) => handleReplyClick(id, tid)}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                    아직 댓글이 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                        })()}
                    </div>
                </div>
            ) : (
                /* DEFAULT VIEW: REPORTED CONTENT + PROFILE + ACTIVITY */
                <div className="h-full overflow-y-auto">
                    {(() => {
                        const profile = report.target_type === 'user' ? (targetData as any) : 
                                        report.target_type === 'chat' ? (targetData as any).sender : 
                                        (targetData as any).profiles;
                        
                        if (!profile) return null;

                        return (
                            <>
                                {/* REPORTED CONTENT */}
                                <div className="m-4 border-2 border-red-500 bg-red-50/50 dark:bg-red-900/10 p-4 rounded-lg mb-4">
                                    <h3 className="text-sm font-bold text-red-500 uppercase mb-3 flex items-center gap-2">
                                        <AlertTriangle size={16} /> 신고된 콘텐츠
                                    </h3>
                                        {report.target_type === 'tweet' && (
                                        <div>
                                            <div className="border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden shadow-sm">
                                                <TweetCard 
                                                    id={(targetData as any).id}
                                                    user={{
                                                        id: (targetData as any).profiles?.id || '00000000-0000-0000-0000-000000000000',
                                                        name: (targetData as any).profiles?.nickname || 'Unknown',
                                                        username: (targetData as any).profiles?.user_id || 'unknown',
                                                        avatar: (targetData as any).profiles?.avatar_url || ''
                                                    }}
                                                    image={(targetData as any).image_urls}
                                                    content={(targetData as any).content}
                                                    timestamp={(targetData as any).created_at}
                                                    createdAt={(targetData as any).created_at}
                                                    stats={{
                                                        likes: (targetData as any).like_count || 0,
                                                        replies: (targetData as any).reply_count || 0,
                                                        retweets: 0,
                                                        views: (targetData as any).view_count || 0
                                                    }}
                                                    liked={false}
                                                    onClick={() => {
                                                        setDetailStack(prev => [...prev, { ...targetData, type: 'tweet' } as any]);
                                                    }}
                                                    disableInteractions={true}
                                                />
                                        </div>
                                        </div>
                                    )}

                                    {report.target_type === 'reply' && (
                                        <div>
                                            <div className="border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden shadow-sm">
                                                <ReplyCard 
                                                    reply={{
                                                        id: (targetData as any).id,
                                                        tweetId: (targetData as any).tweet_id,
                                                        type: 'reply',
                                                        user: {
                                                            id: (targetData as any).profiles?.id || '00000000-0000-0000-0000-000000000000',
                                                            username: (targetData as any).profiles?.user_id || 'unknown',
                                                            name: (targetData as any).profiles?.nickname || 'Unknown',
                                                            avatar: (targetData as any).profiles?.avatar_url || ''
                                                        },
                                                        content: (targetData as any).content,
                                                        timestamp: (targetData as any).created_at,
                                                        createdAt: (targetData as any).created_at,
                                                        stats: {
                                                            likes: (targetData as any).like_count || 0,
                                                            replies: (targetData as any).reply_count || 0,
                                                            retweets: 0,
                                                            views: (targetData as any).view_count || 0
                                                        },
                                                        liked: false
                                                    } as any}
                                                    highlight={true}
                                                    onClick={(id, tweetId) => handleReplyClick(id, tweetId)}
                                                    disableInteractions={true}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {report.target_type === 'chat' && (
                                        <div className="space-y-4">
                                            {/* Reported Messages Section */}
                                            {reportedMessages.length > 0 ? (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-red-500 uppercase">신고된 메시지 ({reportedMessages.length})</h4>
                                                    {reportedMessages.map((msg: any) => (
                                                        <div key={msg.id} className="bg-white dark:bg-black border border-red-200 dark:border-red-900/50 rounded-xl p-4 shadow-sm relative overflow-hidden space-y-2">
                                                            <div className="absolute top-0 right-0 p-1 bg-red-500 text-white text-[10px] font-bold px-2 rounded-bl-lg">신고 대상</div>
                                                            <div className="flex gap-3">
                                                                <Avatar className="w-10 h-10 flex-shrink-0">
                                                                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                                                    <AvatarFallback>?</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-bold">{msg.sender?.nickname}</span>
                                                                        <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                                                                    </div>
                                                                    {msg.content && (
                                                                        <p className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg text-sm border border-red-100 dark:border-red-800 break-all">
                                                                            {msg.content}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {msg.attachments && msg.attachments.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 pl-[52px]">
                                                                    {msg.attachments.map((att: any) => {
                                                                        const fileUrl = att.url || att.file_url || '';
                                                                        const fileName = att.name || att.file_name || 'File';
                                                                        const fileType = att.type || att.file_type || '';
                                                                        const isImage = fileType === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
                                                                        const isVideo = fileType === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(fileUrl);
                                                                        
                                                                        return (
                                                                            <div key={att.id}>
                                                                                {isImage && (
                                                                                    <img src={fileUrl} alt="attachment" className="max-w-xs rounded-lg border border-red-200 cursor-pointer hover:opacity-90" onClick={() => window.open(fileUrl, '_blank')} />
                                                                                )}
                                                                                {isVideo && (
                                                                                    <video src={fileUrl} controls className="max-w-xs rounded-lg border border-red-200" />
                                                                                )}
                                                                                {!isImage && !isVideo && (
                                                                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                                        <span>📎 {fileName}</span>
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-yellow-700 dark:text-yellow-400">
                                                    특정된 신고 메시지가 없습니다. 전체 대화 흐름을 참고하세요.
                                                </div>
                                            )}

                                            {contextData && Array.isArray(contextData) && contextData.length > 0 && (
                                                <div className="pt-4 border-t border-border">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-xs font-bold text-muted-foreground uppercase">
                                                            이전 대화 내용
                                                        </h4>
                                                        <button
                                                            onClick={async () => {
                                                                setShowFullChat(true);
                                                                // Load ALL messages from the chat
                                                                if (targetData?.id && fullChatMessages.length === 0) {
                                                                    const { data: allMsgs } = await (supabase.from('direct_messages') as any)
                                                                        .select('*, attachments:direct_message_attachments(*)')
                                                                        .eq('chat_id', targetData.id)
                                                                        .order('created_at', { ascending: true });
                                                                    
                                                                    if (allMsgs && (allMsgs as any).length > 0) {
                                                                        const senderIds = Array.from(new Set((allMsgs as any).map((m: any) => m.sender_id)));
                                                                        const { data: profiles } = await (supabase.from('profiles') as any).select('*').in('user_id', senderIds);
                                                                        
                                                                        const enriched = allMsgs.map((m: any) => ({
                                                                            ...m,
                                                                            sender: profiles?.find((p: any) => p.user_id === m.sender_id)
                                                                        }));
                                                                        setFullChatMessages(enriched);
                                                                    }
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                                        >
                                                            전체 채팅방 보기
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3 pl-4 border-l-2 border-border/50 ml-2 max-h-96 overflow-y-auto">
                                                        {(contextData as ReportedChatMessage[]).map((msg) => (
                                                            <div key={msg.id} className="flex gap-3 opacity-70 hover:opacity-100 transition-opacity">
                                                                 <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                                                    <AvatarFallback>?</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-sm font-bold">{msg.sender?.nickname}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at as any).toLocaleTimeString()}</span>
                                                                    </div>
                                                                    {msg.content && (
                                                                        <p className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-sm border border-border mb-1">
                                                                            {msg.content}
                                                                        </p>
                                                                    )}
                                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {msg.attachments.map((att: any) => (
                                                                                <div key={att.id} className="text-xs">
                                                                                    {att.type === 'image' && (
                                                                                        <img src={att.url ?? undefined} alt="" className="max-w-[150px] rounded border" />
                                                                                    )}
                                                                                    {att.type === 'video' && (
                                                                                        <video src={att.url ?? undefined} controls className="max-w-[150px] rounded border" />
                                                                                    )}
                                                                                    {att.type === 'file' && (
                                                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                                                                            📎 {att.name || 'File'}
                                                                                        </a>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {report.target_type === 'user' && (
                                            <div className="flex items-center justify-center p-4 bg-secondary/30 rounded-xl text-sm text-muted-foreground">
                                                <User size={16} className="mr-2" /> 계정 신고 - 하단 프로필 및 활동 내역을 참고하세요.
                                            </div>
                                        )}
                                </div>

                                {/* PROFILE HEADER */}
                                <div className="mb-4">
                                    <ProfileHeader 
                                        userProfile={{
                                            id: profile.id,
                                            user_id: profile.user_id,
                                            name: profile.nickname,
                                            username: profile.user_id,
                                            avatar: profile.avatar_url || '',
                                            bio: profile.bio,
                                            joinDate: new Date(profile.created_at as any).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
                                            followers: profile.followers_count || 0,
                                            following: profile.following_count || 0,
                                            banner: profile.banner_url,
                                            bannerPositionY: profile.banner_position_y,
                                            country: targetData?.countryName,
                                            countryFlagUrl: targetData?.countryFlagUrl,
                                        }}
                                        isOwnProfile={false}
                                        hideFollowButton={true}
                                    />
                                </div>

                                {/* USER ACTIVITY */}
                                <div className="mx-4 mb-4" ref={activitySectionRef}>
                                    <div className="bg-white dark:bg-black border-b border-border mb-4">
                                        <ProfileTabs activeTab={activeUserTab} onTabChange={setActiveUserTab} />
                                    </div>
                                    <ProfileTweets 
                                        activeTab={activeUserTab} 
                                        userProfile={{
                                            id: profile.id,
                                            name: profile.nickname,
                                            username: profile.user_id,
                                            avatar: profile.avatar_url || '',
                                        }}
                                        onItemClick={async (item) => {
                                            // If it's a reply, load the parent tweet
                                            if (item.type === 'reply' && (item as unknown as { tweetId: string }).tweetId) {
                                                await handleReplyClick((item as unknown as { id: string }).id, (item as unknown as { tweetId: string }).tweetId);
                                            } else {
                                                // For regular tweets, just add to stack
                                                setDetailStack(prev => [...prev, item]);
                                            }
                                        }}
                                        disableInteractions={true}
                                    />
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
      </div>

      {/* Full Chat View Overlay */}
      {showFullChat && report?.target_type === 'chat' && ((fullChatMessages as any).length > 0 ? fullChatMessages : contextData) && (() => {
        const messages = ((fullChatMessages as any).length > 0 ? fullChatMessages : contextData) as any;
        const reporterUserId = report.reporter?.user_id;
        
        return (
          <div className="absolute inset-0 bg-background z-50 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">전체 채팅방 ({(messages as any)?.length || 0}개 메시지)</h3>
              <button
                onClick={() => setShowFullChat(false)}
                className="px-3 py-1.5 text-sm hover:bg-secondary rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(messages as any)?.map((msg: any) => {
                const isReporter = msg.sender?.user_id === reporterUserId;
                
                return (
                  <div key={msg.id} className="mb-4">
                    <div className={`flex gap-2 items-start ${isReporter ? 'justify-end' : 'justify-start'}`}>
                    {/* Left Avatar (for reported user) */}
                    {!isReporter && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={msg.sender?.avatar_url || undefined} />
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[65%] min-w-0 ${isReporter ? 'items-end' : 'items-start'}`}>
                      {/* Sender Name & Time */}
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {msg.sender?.nickname}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at as any).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {/* Text Content */}
                      {msg.content && (
                        <div className={`px-3 py-2 rounded-2xl text-sm break-all whitespace-pre-wrap ${
                          isReporter 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-secondary text-foreground rounded-tl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      )}
                    </div>
                    
                    {/* Right Avatar (for reporter) */}
                    {isReporter && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={msg.sender?.avatar_url ?? undefined} />
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                    )}
                    </div>
                    
                    {/* Attachments (outside bubble, but inside the message item's wrapper div) */}
                    {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className={`flex flex-wrap gap-2 ${isReporter ? 'justify-end pr-10' : 'pl-10'}`}>
                        {msg.attachments.map((att: any) => {
                          // Detect file type from URL or type field
                          const fileUrl = att.url || att.file_url || '';
                          const fileName = att.name || att.file_name || 'File';
                          const fileType = att.type || att.file_type || '';
                          
                          // Check if it's an image
                          const isImage = fileType === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
                          // Check if it's a video
                          const isVideo = fileType === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(fileUrl);
                          
                          return (
                            <div key={att.id}>
                              {isImage && (
                                <img 
                                  src={fileUrl} 
                                  alt={fileName}
                                  className="max-w-sm max-h-64 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(fileUrl, '_blank')}
                                />
                              )}
                              {isVideo && (
                                <video 
                                  src={fileUrl} 
                                  controls 
                                  className="max-w-sm max-h-64 rounded-lg border"
                                />
                              )}
                              {!isImage && !isVideo && (
                                <a 
                                  href={fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isReporter
                                      ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                                      : 'bg-secondary/80 text-foreground hover:bg-secondary border border-border'
                                  }`}
                                >
                                  📎 {fileName}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
