import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/common/Modal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { addDays, addYears } from 'date-fns';
import { formatRelativeTime } from '@/utils/dateUtils';
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
  Ban,
  Trash2,
  CheckCircle,
  XOctagon,
  ArrowRight,
  Eye,
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

export default function ReportActionModal({ report, isOpen, onClose, onResolve }: ReportActionModalProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [targetData, setTargetData] = useState<any>(null);
  const [contextData, setContextData] = useState<any>(null);
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
  const activitySectionRef = useRef<HTMLDivElement>(null);

  // Chat Report State
  const [chatHasMore, setChatHasMore] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [reportedMessages, setReportedMessages] = useState<any[]>([]);
  const [showFullChat, setShowFullChat] = useState(false);
  const [fullChatMessages, setFullChatMessages] = useState<any[]>([]);

  const loadMoreChat = async () => {
      if (!targetData?.id || isChatLoading || !contextData?.length) return;
      setIsChatLoading(true);
      
      const oldestMsg = contextData[0];
      const { data: moreMsgs } = await supabase
          .from('direct_messages')
          .select('*')
          .eq('chat_id', targetData.id)
          .lt('created_at', oldestMsg.created_at)
          .order('created_at', { ascending: false }) // Fetch closest past messages
          .limit(50);
          
      if (moreMsgs && moreMsgs.length > 0) {
           const senderIds = Array.from(new Set(moreMsgs.map(m => m.sender_id)));
           const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', senderIds);
           const msgsWithSender = moreMsgs.map(m => ({...m, sender: profiles?.find(p => p.user_id === m.sender_id)})).reverse();
           
           setContextData((prev: any) => [...msgsWithSender, ...prev]);
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

  // Auto-scroll to activity section when detailStack changes
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
      setTargetData(null);
      setContextData(null);
      setActiveUserTab('posts');
      setDetailStack([]);
      setReportedMessages([]);
    }
  }, [isOpen, report]);

  const [fetchedReporter, setFetchedReporter] = useState<any>(null);

  const fetchTargetData = async () => {
    if (!report) return;
    setLoading(true);
    try {
      let fetchedProfile = null;
      
      // Fetch Reporter Data if exists
      if (report.reporter?.user_id) {
          const { data: reporterData } = await supabase.from('profiles').select('*').eq('user_id', report.reporter.user_id).maybeSingle();
          if (reporterData) {
              let rCountryName = reporterData.country;
              let rCountryFlagUrl = null;
              if (reporterData.country) {
                   const { data: cRow } = await supabase.from('countries').select('name, flag_url').eq('id', reporterData.country).maybeSingle();
                   if (cRow) {
                       rCountryName = cRow.name;
                       rCountryFlagUrl = cRow.flag_url;
                   }
              }
              setFetchedReporter({ ...reporterData, countryName: rCountryName, countryFlagUrl: rCountryFlagUrl });
          }
      }

      if (report.target_type === 'tweet') {
        const { data } = await supabase.from('tweets').select('*, profiles(*)').eq('id', report.target_id).maybeSingle();
        setTargetData(data);
        fetchedProfile = data?.profiles;
      } else if (report.target_type === 'reply') {
        const { data: reply, error: replyError } = await supabase.from('tweet_replies').select('*, profiles(*)').eq('id', report.target_id).maybeSingle();
        
        if (replyError) {
             console.log('Reply fetch error (might be deleted):', replyError);
             setTargetData(null);
        } else {
             setTargetData(reply);
             fetchedProfile = reply?.profiles;
             if (reply?.tweet_id) {
                const { data: parent } = await supabase.from('tweets').select('*, profiles(*)').eq('id', reply.tweet_id).maybeSingle();
                setContextData(parent);
             }
        }
      } else if (report.target_type === 'user') {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', report.target_id).maybeSingle();
        setTargetData(profile);
        fetchedProfile = profile;
      } else if (report.target_type === 'chat') {
         // Target is Chat Room
         const { data: room, error: roomError } = await supabase.from('direct_chats').select('*').eq('id', report.target_id).maybeSingle();
         
         if (room) {
             // Identify Suspect (The one being reported)
             // First, get reporter's profile ID from auth user_id
             const reporterAuthId = report.reporter?.user_id;
             const { data: reporterProfile } = await supabase
                 .from('profiles')
                 .select('id')
                 .eq('user_id', reporterAuthId)
                 .maybeSingle();
             
             const reporterProfileId = reporterProfile?.id;
             
             // Determine suspect: the other person in the chat
             const suspectProfileId = room.user1_id === reporterProfileId ? room.user2_id : room.user1_id;
             
             const { data: suspectProfile } = await supabase.from('profiles').select('*').eq('id', suspectProfileId).maybeSingle();

             // Fetch country for suspect
             let countryName = suspectProfile?.country;
             let countryFlagUrl = null;
             if (suspectProfile?.country) {
                 const { data: countryRow } = await supabase.from('countries').select('name, flag_url').eq('id', suspectProfile.country).maybeSingle();
                 if (countryRow) {
                     countryName = countryRow.name;
                     countryFlagUrl = countryRow.flag_url;
                 }
             }

             setTargetData({ ...room, sender: suspectProfile, countryName, countryFlagUrl });
             
             // Fetch Latest Messages (Context) with attachments
             const { data: messages } = await supabase
                .from('direct_messages')
                .select('*, attachments:direct_message_attachments(*)')
                .eq('chat_id', room.id)
                .order('created_at', { ascending: false }) 
                .limit(50);

             // Fetch specifically reported messages if IDs exist
             if (report.metadata?.reported_message_ids && report.metadata.reported_message_ids.length > 0) {
                 const { data: reportedMsgs } = await supabase
                    .from('direct_messages')
                    .select('*, attachments:direct_message_attachments(*)')
                    .in('id', report.metadata.reported_message_ids);
                 
                 if (reportedMsgs && reportedMsgs.length > 0) {
                     const rSenderIds = Array.from(new Set(reportedMsgs.map(m => m.sender_id)));
                     const { data: rProfiles } = await supabase.from('profiles').select('*').in('user_id', rSenderIds);
                     const enrichedReportedMsgs = reportedMsgs.map(m => ({
                         ...m,
                         sender: rProfiles?.find(p => p.user_id === m.sender_id)
                     })).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                     setReportedMessages(enrichedReportedMsgs);
                 }
             }

             if (messages && messages.length > 0) {
                 const senderIds = Array.from(new Set(messages.map(m => m.sender_id)));
                 const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', senderIds);
                 
                 const messagesWithSenders = messages.map(m => ({
                     ...m,
                     sender: profiles?.find(p => p.user_id === m.sender_id)
                 })).reverse(); // Chronological for display
                 
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

      // Fetch country information for the profile
      if (fetchedProfile) {
        let countryName = fetchedProfile.country;
        let countryFlagUrl = null;
        
        if (fetchedProfile.country) {
             const { data: countryRow } = await supabase.from('countries').select('name, flag_url').eq('id', fetchedProfile.country).maybeSingle();
             if (countryRow) {
                 countryName = countryRow.name;
                 countryFlagUrl = countryRow.flag_url;
             }
        }
        
        setTargetData(prev => ({ ...prev, countryName, countryFlagUrl }));
      }
    } catch (error) {
      console.error('Error fetching target data:', error);
      toast.error('상세 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = async (replyId: string, tweetId: string) => {
    try {
      // Fetch the parent tweet
      const { data: tweet, error } = await supabase
        .from('tweets')
        .select('*, profiles(*)')
        .eq('id', tweetId)
        .maybeSingle();
      
      if (error || !tweet) {
        toast.error('원본 게시글을 불러올 수 없습니다.');
        return;
      }

      // Convert to FeedItem format and add to detailStack
      const feedItem = {
        id: tweet.id,
        type: 'tweet' as const,
        user: {
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
    } catch (error) {
      console.error('Error loading parent tweet:', error);
      toast.error('게시글 로드 실패');
    }
  };

  const handleAction = async (action: 'dismiss' | 'delete' | 'ban') => {
    if (!report) return;

    if (action === 'ban') {
       // Reset ban dialog state to default
       setBanDuration(1);
       setCustomDays('');
       setShowBanDialog(true);
       return; 
    }
    
    if (action === 'dismiss') {
        setShowDismissDialog(true);
        return;
    }

    // For delete, show confirmation modal
    if (action === 'delete') {
         setShowDeleteDialog(true);
    }
  };

  const executeDismiss = async () => {
      if (!report) return;
      try {
          await supabase.from('reports').update({ status: 'dismissed' }).eq('id', report.id);
          toast.success('신고가 기각되었습니다.');
          onResolve();
          onClose();
      } catch (e) {
          console.error(e);
          toast.error('작업 수행 실패');
      } finally {
          setShowDismissDialog(false);
      }
  };

  const executeDelete = async () => {
      if (!report) return;
      try {
        if (report.target_type === 'tweet') {
            await supabase.from('tweets').update({ deleted_at: new Date().toISOString() }).eq('id', report.target_id);
        } else if (report.target_type === 'reply') {
            await supabase.from('tweet_replies').update({ deleted_at: new Date().toISOString() }).eq('id', report.target_id);
        } else if (report.target_type === 'chat') {
            await supabase.from('direct_messages').update({ deleted_at: new Date().toISOString() }).eq('id', report.target_id);
        }
        await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
        toast.success('콘텐츠 삭제 및 신고 처리가 완료되었습니다.');
        
        onResolve();
        onClose();
      } catch (e) {
          console.error(e);
          toast.error('작업 수행 실패');
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
          
          if (report.target_type === 'user') {
               await supabase.from('profiles').update({ banned_until: until }).eq('id', report.target_id);
          } else {
               // If target is tweet/reply/chat, ban the AUTHOR
               let userIdToBan = report.reporter?.user_id; // Default fallback (wrong)
               // We need to know who the author is. 
               // logic: fetched targetData has profiles object usually?
               // targetData load might be async, but we can rely on report details or fetch again?
               // Easier: use targetData if available.
               // Check targetData structure:
               if (targetData?.profiles?.id) {
                   await supabase.from('profiles').update({ banned_until: until }).eq('id', targetData.profiles.id);
               } else if (targetData?.sender?.id) { // Chat
                   await supabase.from('profiles').update({ banned_until: until }).eq('id', targetData.sender.id);
               } else {
                   toast.error('사용자 정보를 찾을 수 없어 제재할 수 없습니다.');
                   setIsBanProcessing(false);
                   return;
               }
          }

          // Mark report as resolved
          await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
          // Mark report as resolved
          await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
          const durationText = banDuration === 'permanent' ? '영구' : banDuration === 'custom' ? `${customDays}일` : `${banDuration}일`;
          toast.success(`사용자를 ${durationText}간 정지했습니다.`);
          
          setShowBanDialog(false);
          onResolve();
          onClose();
      } catch (err: any) {
          console.error(err);
          toast.error('제재 처리 실패: ' + err.message);
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
                                    // Make sure to adapt properties if needed for base item, but type 'user' is special
                                }]);
                            }
                        }}
                        className={`flex items-center gap-3 bg-background border border-border rounded-xl p-3 relative ${fetchedReporter ? 'cursor-pointer hover:bg-secondary/50 transition-colors group' : ''}`}
                    >
                        <div className="shrink-0 flex items-center justify-center w-8 text-muted-foreground">
                             <span className="text-xs font-bold">FROM</span>
                        </div>
                        <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={report.reporter?.avatar_url} />
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
                                            <img src={fetchedReporter.countryFlagUrl} alt={fetchedReporter.countryName} className="w-3.5 h-3.5 rounded-full object-cover" />
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
                             <AvatarImage src={targetData?.profiles?.avatar_url || targetData?.sender?.avatar_url || targetData?.avatar_url} />
                             <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-red-500 dark:text-red-400 font-bold uppercase mb-0.5">대상자 (피신고자)</p>
                            <p className="text-sm font-bold truncate">
                                {targetData?.profiles?.nickname || targetData?.sender?.nickname || targetData?.nickname || 'Loading...'}
                            </p>

                            {/* Detailed Info (Age, Gender, Country) */}
                            {(() => {
                                const profile = report.target_type === 'user' ? targetData : 
                                              report.target_type === 'chat' ? targetData?.sender : 
                                              targetData?.profiles;
                                
                                return profile ? (
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                        {targetData?.countryFlagUrl && (
                                            <span className="flex items-center gap-1 bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                                                <img src={targetData.countryFlagUrl} alt={targetData.countryName} className="w-3.5 h-3.5 rounded-full object-cover" />
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
                     <button 
                        onClick={() => handleAction('delete')}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm font-medium shadow-sm"
                     >
                        <Trash2 size={16} /> 콘텐츠 삭제
                    </button>
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
                            if ((item as any).type === 'user') {
                                const p = item as any; 
                                // Fallback objects for profile headers
                                const userP = {
                                    id: p.id,
                                    user_id: p.user_id,
                                    name: p.nickname,
                                    username: p.user_id,
                                    avatar: p.avatar_url,
                                    bio: p.bio,
                                    joinDate: p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
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
                                                            if (item.type === 'reply' && (item as any).tweetId) {
                                                                await handleReplyClick((item as any).id, (item as any).tweetId);
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
                                            timestamp: item.timestamp || item.created_at || item.createdAt
                                        } as UIReply}
                                        highlight={false}
                                        disableInteractions={true}
                                        onClick={(id, tid) => { setDetailStack(prev => [...prev, { ...item, type: 'reply' } as any]); }} 
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
                        const profile = report.target_type === 'user' ? targetData : 
                                        report.target_type === 'chat' ? targetData.sender : 
                                        targetData.profiles;
                        
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
                                                id={targetData.id}
                                                user={{
                                                    username: targetData.profiles?.user_id || 'unknown',
                                                    name: targetData.profiles?.nickname || 'Unknown',
                                                    avatar: targetData.profiles?.avatar_url || ''
                                                }}
                                                content={targetData.content}
                                                image={targetData.image_urls}
                                                timestamp={targetData.created_at}
                                                createdAt={targetData.created_at}
                                                stats={{
                                                    likes: targetData.like_count || 0,
                                                    replies: targetData.reply_count || 0,
                                                    retweets: 0,
                                                    views: targetData.view_count || 0
                                                }}
                                                liked={false}
                                                onClick={() => {
                                                    setDetailStack(prev => [...prev, { ...targetData, type: 'tweet' }]);
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
                                                    id: targetData.id,
                                                    tweetId: targetData.tweet_id,
                                                    type: 'reply',
                                                    user: {
                                                        username: targetData.profiles?.user_id || 'unknown',
                                                        name: targetData.profiles?.nickname || 'Unknown',
                                                        avatar: targetData.profiles?.avatar_url || ''
                                                    },
                                                    content: targetData.content,
                                                    timestamp: targetData.created_at,
                                                    createdAt: targetData.created_at,
                                                    stats: {
                                                        likes: targetData.like_count || 0,
                                                        replies: targetData.reply_count || 0,
                                                        retweets: 0,
                                                        views: targetData.view_count || 0
                                                    },
                                                    liked: false
                                                }}
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
                                                    {reportedMessages.map(msg => (
                                                        <div key={msg.id} className="bg-white dark:bg-black border border-red-200 dark:border-red-900/50 rounded-xl p-4 shadow-sm relative overflow-hidden space-y-2">
                                                            <div className="absolute top-0 right-0 p-1 bg-red-500 text-white text-[10px] font-bold px-2 rounded-bl-lg">신고 대상</div>
                                                            <div className="flex gap-3">
                                                                <Avatar className="w-10 h-10 flex-shrink-0">
                                                                    <AvatarImage src={msg.sender?.avatar_url} />
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
                                                                    const { data: allMsgs } = await supabase
                                                                        .from('direct_messages')
                                                                        .select('*, attachments:direct_message_attachments(*)')
                                                                        .eq('chat_id', targetData.id)
                                                                        .order('created_at', { ascending: true });
                                                                    
                                                                    if (allMsgs && allMsgs.length > 0) {
                                                                        const senderIds = Array.from(new Set(allMsgs.map(m => m.sender_id)));
                                                                        const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', senderIds);
                                                                        
                                                                        const enriched = allMsgs.map(m => ({
                                                                            ...m,
                                                                            sender: profiles?.find(p => p.user_id === m.sender_id)
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
                                                        {contextData.map((msg: any) => (
                                                            <div key={msg.id} className="flex gap-3 opacity-70 hover:opacity-100 transition-opacity">
                                                                 <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={msg.sender?.avatar_url} />
                                                                    <AvatarFallback>?</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-sm font-bold">{msg.sender?.nickname}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString()}</span>
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
                                                                                        <img src={att.url} alt="" className="max-w-[150px] rounded border" />
                                                                                    )}
                                                                                    {att.type === 'video' && (
                                                                                        <video src={att.url} controls className="max-w-[150px] rounded border" />
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
                                            avatar: profile.avatar_url,
                                            bio: profile.bio,
                                            joinDate: new Date(profile.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
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
                                            avatar: profile.avatar_url,
                                        }}
                                        onItemClick={async (item) => {
                                            // If it's a reply, load the parent tweet
                                            if (item.type === 'reply' && (item as any).tweetId) {
                                                await handleReplyClick((item as any).id, (item as any).tweetId);
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
      {showFullChat && report?.target_type === 'chat' && (fullChatMessages.length > 0 ? fullChatMessages : contextData) && (() => {
        const messages = fullChatMessages.length > 0 ? fullChatMessages : contextData;
        const reporterUserId = report.reporter?.user_id;
        
        return (
          <div className="absolute inset-0 bg-background z-50 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">전체 채팅방 ({messages.length}개 메시지)</h3>
              <button
                onClick={() => setShowFullChat(false)}
                className="px-3 py-1.5 text-sm hover:bg-secondary rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg: any) => {
                const isReporter = msg.sender?.user_id === reporterUserId;
                
                return (
                  <div key={msg.id} className="mb-4">
                    <div className={`flex gap-2 items-start ${isReporter ? 'justify-end' : 'justify-start'}`}>
                    {/* Left Avatar (for reported user) */}
                    {!isReporter && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={msg.sender?.avatar_url} />
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
                          {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
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
                        <AvatarImage src={msg.sender?.avatar_url} />
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
