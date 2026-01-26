import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  X,
  Download,
  History,
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
import MediaViewer, { type MediaItem } from '@/components/chat/direct/MediaViewer';
import SanctionDialog from './SanctionDialog';

/** 나이 계산 함수 (만 나이) */
const calculateAge = (birthday: string | null | undefined) => {
  if (!birthday) return null;
  try {
    const birthDate = new Date(birthday);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    return null;
  }
};

/** 성별 번역 함수 (대소문자 무관) */
const translateGender = (gender: string | null | undefined) => {
  if (!gender) return null;
  const g = gender.toLowerCase();
  if (g === 'male') return '남성';
  if (g === 'female') return '여성';
  return gender;
};

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
  content_snapshot?: any[];
}

interface ReportActionModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: () => void;
}

export default function ReportActionModal({
  report,
  isOpen,
  onClose,
  onResolve,
}: ReportActionModalProps) {
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
  const [sanctionMode, setSanctionMode] = useState<'ban' | 'unban'>('ban');
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const activitySectionRef = useRef<HTMLDivElement>(null);

  // Chat Report State
  const [chatHasMore, setChatHasMore] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [reportedMessages, setReportedMessages] = useState<any[]>([]);
  const [showFullChat, setShowFullChat] = useState(false);
  const [fullChatMessages, setFullChatMessages] = useState<any[]>([]);

  // Lightbox State
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);

  const loadMoreChat = async () => {
    if (!targetData?.id || isChatLoading || !contextData?.length) return;
    setIsChatLoading(true);

    const oldestMsg = contextData[0];
    const { data: moreMsgs } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('chat_id', targetData.id)
      .lt('created_at', oldestMsg.created_at)
      .limit(20);

    if (moreMsgs && moreMsgs.length > 0) {
      const senderIds = Array.from(new Set(moreMsgs.map(m => m.sender_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', senderIds);

      const enrichedMsgs = moreMsgs
        .map(m => ({
          ...m,
          sender: profiles?.find(p => p.user_id === m.sender_id),
        }))
        .reverse();

      setContextData((prev: any) => [...enrichedMsgs, ...prev]);
      setChatHasMore(moreMsgs.length === 20);
    } else {
      setChatHasMore(false);
    }
    setIsChatLoading(false);
  };

  useEffect(() => {
    const sourceMessages = showFullChat
      ? fullChatMessages
      : [...(reportedMessages || []), ...(contextData || [])];
    // Deduplicate by ID
    const uniqueMsgs = Array.from(new Map(sourceMessages.map(m => [m.id, m])).values());
    // Sort by created_at (Oldest first for natural reading order in slider? Or Newest first?)
    // Chat is usually bottom-up (Newest at bottom). Slider usually goes Left(Prev) -> Right(Next).
    // If we want "Next" to be "Newer", we sort Ascending.
    uniqueMsgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const media: MediaItem[] = [];
    uniqueMsgs.forEach(msg => {
      const isDeleted = msg.deleted_at || msg.content === '관리자에 의해 삭제된 메시지입니다.';
      if (msg.attachments && msg.attachments.length > 0 && !isDeleted) {
        // Exclude deleted messages
        msg.attachments.forEach((att: any) => {
          const type = (att.type || att.file_type || '').toLowerCase();
          const url = att.url || att.file_url;
          if (!url) return;

          if (type === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(url)) {
            media.push({
              url,
              messageId: msg.id,
              date: msg.created_at,
              senderId: msg.sender?.user_id || msg.sender_id,
              senderName: msg.sender?.nickname || 'Unknown',
              senderAvatarUrl: msg.sender?.avatar_url,
              type: 'video',
            });
          } else if (
            type !== 'file' &&
            (type === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url))
          ) {
            media.push({
              url,
              messageId: msg.id,
              date: msg.created_at,
              senderId: msg.sender?.user_id || msg.sender_id,
              senderName: msg.sender?.nickname || 'Unknown',
              senderAvatarUrl: msg.sender?.avatar_url,
              type: 'image',
            });
          }
        });
      }
    });
    setMediaList(media);
  }, [fullChatMessages, reportedMessages, contextData, showFullChat]);

  // Clean up state on close
  useEffect(() => {
    if (isOpen && report) {
      fetchTargetData();
    } else {
      setTargetData(null);
      setContextData(null);
      setActiveUserTab('posts');
      setDetailStack([]);
      setReportedMessages([]);
      setSelectedMediaId(null);
      setMediaList([]);
      setReplies([]);
    }
  }, [isOpen, report]);

  // Fetch replies when viewing a tweet in detailStack
  useEffect(() => {
    const fetchRepliesForStack = async () => {
      const topItem = detailStack[detailStack.length - 1];
      if (topItem && (topItem.type === 'tweet' || (topItem as any).type === 'post')) {
        setRepliesLoading(true);
        try {
          // Force fetch from DB to ensure we have latest replies
          const fetchedReplies = await tweetService.getRepliesByTweetId(topItem.id, 0, true);
          setReplies(fetchedReplies);
        } catch (error) {
          // Error handled silently
          // Only show error if we are still on this tweet
          const currentTop = detailStack[detailStack.length - 1];
          if (currentTop?.id === topItem.id) {
            toast.error('댓글을 불러오지 못했습니다.');
          }
        } finally {
          setRepliesLoading(false);
        }
      } else if (!topItem) {
        // Reset when stack is empty (showing main report content)
        // But wait, if main report content is a tweet, it's not in the stack?
        // Actually, the main view (when stack is empty) handles its own loading usually.
        // Let's check how main view tweet is rendered.
        setReplies([]);
      } else {
        setReplies([]);
      }
    };

    fetchRepliesForStack();
  }, [detailStack]);

  const [fetchedReporter, setFetchedReporter] = useState<any>(null);

  const fetchTargetData = async () => {
    if (!report) return;
    setLoading(true);
    try {
      let fetchedProfile = null;

      // Fetch Reporter Data if exists
      if (report.reporter?.user_id) {
        const { data: reporterData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', report.reporter.user_id)
          .maybeSingle();
        if (reporterData) {
          let rCountryName = reporterData.country;
          let rCountryFlagUrl = null;
          if (reporterData.country) {
            const { data: cRow } = await supabase
              .from('countries')
              .select('name, flag_url')
              .eq('id', reporterData.country)
              .maybeSingle();
            if (cRow) {
              rCountryName = cRow.name;
              rCountryFlagUrl = cRow.flag_url;
            }
          }
          setFetchedReporter({
            ...reporterData,
            countryName: rCountryName,
            countryFlagUrl: rCountryFlagUrl,
          });
        }
      }

      if (report.target_type === 'tweet') {
        const { data } = await supabase
          .from('tweets')
          .select('*, profiles(*)')
          .eq('id', report.target_id)
          .maybeSingle();
        setTargetData(data);
        fetchedProfile = data?.profiles;
      } else if (report.target_type === 'reply') {
        const { data: reply, error: replyError } = await supabase
          .from('tweet_replies')
          .select('*, profiles(*)')
          .eq('id', report.target_id)
          .maybeSingle();

        if (replyError) {
          // Reply fetch error
          setTargetData(null);
        } else {
          setTargetData(reply);
          fetchedProfile = reply?.profiles;
          if (reply?.tweet_id) {
            const { data: parent } = await supabase
              .from('tweets')
              .select('*, profiles(*)')
              .eq('id', reply.tweet_id)
              .maybeSingle();
            setContextData(parent);
          }
        }
      } else if (report.target_type === 'user') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', report.target_id)
          .maybeSingle();
        setTargetData(profile);
        fetchedProfile = profile;
      } else if (report.target_type === 'chat') {
        // Target is Chat Room
        const { data: room, error: roomError } = await supabase
          .from('direct_chats')
          .select('*')
          .eq('id', report.target_id)
          .maybeSingle();

        if (room) {
          // Identify Suspect (The one being reported)
          // First, get reporter's profile ID from auth user_id
          const reporterAuthId = report.reporter?.user_id;
          let reporterProfileId = null;

          if (reporterAuthId) {
            const { data: reporterProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', reporterAuthId)
              .maybeSingle();

            reporterProfileId = reporterProfile?.id;
          }

          // Determine suspect: the other person in the chat
          const suspectProfileId =
            room.user1_id === reporterProfileId ? room.user2_id : room.user1_id;

          const { data: suspectProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', suspectProfileId)
            .maybeSingle();

          // Fetch country for suspect
          let countryName = suspectProfile?.country;
          let countryFlagUrl = null;
          if (suspectProfile?.country) {
            const { data: countryRow } = await supabase
              .from('countries')
              .select('name, flag_url')
              .eq('id', suspectProfile.country)
              .maybeSingle();
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
          if (
            report.metadata?.reported_message_ids &&
            report.metadata.reported_message_ids.length > 0
          ) {
            // 1. Try to use Content Snapshot (Preserved Original Content)
            if (
              report.content_snapshot &&
              Array.isArray(report.content_snapshot) &&
              report.content_snapshot.length > 0
            ) {
              // Ensure sorting
              const snapshotMsgs = [...report.content_snapshot].sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
              );
              setReportedMessages(snapshotMsgs);
            }
            // 2. Fallback to DB Fetch (For old reports or if snapshot missing)
            else {
              const { data: reportedMsgs } = await supabase
                .from('direct_messages')
                .select('*, attachments:direct_message_attachments(*)')
                .in('id', report.metadata.reported_message_ids);

              if (reportedMsgs && reportedMsgs.length > 0) {
                const rSenderIds = Array.from(new Set(reportedMsgs.map(m => m.sender_id)));
                const { data: rProfiles } = await supabase
                  .from('profiles')
                  .select('*')
                  .in('user_id', rSenderIds);
                const enrichedReportedMsgs = reportedMsgs
                  .map(m => ({
                    ...m,
                    sender: rProfiles?.find(p => p.user_id === m.sender_id),
                  }))
                  .sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                  );
                setReportedMessages(enrichedReportedMsgs);
              }
            }
          }

          if (messages && messages.length > 0) {
            const senderIds = Array.from(new Set(messages.map(m => m.sender_id)));
            const { data: profiles } = await supabase
              .from('profiles')
              .select('*')
              .in('user_id', senderIds);

            const messagesWithSenders = messages
              .map(m => ({
                ...m,
                sender: profiles?.find(p => p.user_id === m.sender_id),
              }))
              .reverse(); // Chronological for display

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
          const { data: countryRow } = await supabase
            .from('countries')
            .select('name, flag_url')
            .eq('id', fetchedProfile.country)
            .maybeSingle();
          if (countryRow) {
            countryName = countryRow.name;
            countryFlagUrl = countryRow.flag_url;
          }
        }

        setTargetData((prev: any) => ({ ...prev, countryName, countryFlagUrl }));
      }
    } catch (error) {
      // Error handled silently
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
          id: tweet.profiles?.id || 'unknown',
          name: tweet.profiles?.nickname || 'Unknown',
          username: tweet.profiles?.user_id || 'unknown',
          avatar: tweet.profiles?.avatar_url || '',
        },
        content: tweet.content,
        timestamp: tweet.created_at,
        createdAt: tweet.created_at,
        stats: {
          likes: tweet.like_count || 0,
          replies: tweet.reply_count || 0,
          retweets: 0,
          views: tweet.view_count || 0,
        },
        image: tweet.image_urls,
      };

      setDetailStack(prev => [...prev, feedItem]);
    } catch (error) {
      // Error handled silently
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

      // Notify Reporter
      if (report.reporter?.user_id) {
        const { data: reporterProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', report.reporter.user_id)
          .maybeSingle();
        if (reporterProfile) {
          const targetName =
            targetData?.nickname ||
            targetData?.profiles?.nickname ||
            targetData?.sender?.nickname ||
            'Unknown';
          const reportReasonKey = report.reason
            ? `report.reasons.${report.reason}`
            : 'report.reasons.other';
          const reporterPayload = {
            type: 'system_reporter_feedback',
            data: {
              target: targetName,
              reasonKey: reportReasonKey,
              actionType: 'dismiss',
            },
          };

          const payload = {
            type: 'system',
            content: JSON.stringify(reporterPayload),
            receiver_id: reporterProfile.id,
            is_read: false,
          };
          await supabase.from('notifications').insert(payload);
        }
      }

      toast.success('신고가 기각되었습니다.');
      onResolve();
      onClose();
    } catch (e) {
      toast.error('작업 수행 실패');
    } finally {
      setShowDismissDialog(false);
    }
  };

  const executeDelete = async () => {
    if (!report) return;
    try {
      if (report.target_type === 'tweet') {
        await supabase
          .from('tweets')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', report.target_id);
      } else if (report.target_type === 'reply') {
        await supabase
          .from('tweet_replies')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', report.target_id);
      } else if (report.target_type === 'chat') {
        // Delete SPECIFIC reported messages if available
        if (
          report.metadata?.reported_message_ids &&
          report.metadata.reported_message_ids.length > 0
        ) {
          await supabase
            .from('direct_messages')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', report.metadata.reported_message_ids);
        } else {
          // Fallback: If no specific messages, delete the whole room? Or maybe just warn?
          // For now, let's keep the target_id logic but assume report.target_id is the room, which might be too broad.
          // Reverting to doing nothing if no specific messages are selected to prevent room deletion accident.
          toast.error('삭제할 신고 메시지가 선택되지 않았습니다.');
          return;
        }
      }
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);

      // Notify Reporter
      if (report.reporter?.user_id) {
        const { data: reporterProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', report.reporter.user_id)
          .maybeSingle();
        if (reporterProfile) {
          const targetName =
            targetData?.nickname ||
            targetData?.profiles?.nickname ||
            targetData?.sender?.nickname ||
            'Unknown';
          const reportReasonKey = report.reason
            ? `report.reasons.${report.reason}`
            : 'report.reasons.other';
          const reporterPayload = {
            type: 'system_reporter_feedback',
            data: {
              target: targetName,
              reasonKey: reportReasonKey,
              actionType: 'delete',
            },
          };

          const payload = {
            type: 'system',
            content: JSON.stringify(reporterPayload),
            receiver_id: reporterProfile.id,
            is_read: false,
          };
          await supabase.from('notifications').insert(payload);
        }
      }

      // Notify Target User (Content Author)
      // targetData contains profiles info for the reported content
      const targetProfile = targetData?.profiles || targetData?.sender;
      if (targetProfile?.id) {
        const payload = {
          type: 'system',
          content: `귀하의 ${report.target_type === 'tweet' ? '게시글' : '댓글'}이 운영 정책 위반으로 인해 삭제되었습니다.`,
          receiver_id: targetProfile.id,
          is_read: false,
        };
        await supabase.from('notifications').insert(payload);
      }

      toast.success('콘텐츠 삭제 및 신고 처리가 완료되었습니다.');

      onResolve();
      onClose();
      // Update local state to reflect deletion immediately
      const updateDeletedState = (prev: any[]) =>
        prev?.map(msg =>
          report.metadata?.reported_message_ids?.includes(msg.id)
            ? {
                ...msg,
                deleted_at: new Date().toISOString(),
                content: '관리자에 의해 삭제된 메시지입니다.',
                attachments: [],
              }
            : msg,
        );

      if (contextData) setContextData((prev: any) => updateDeletedState(prev));
      if (reportedMessages) setReportedMessages((prev: any) => updateDeletedState(prev));
    } catch (e) {
      toast.error('작업 수행 실패');
    }
  };

  const executeBan = async () => {
    // Handled by SanctionDialog now
  };

  const handleSanctionSuccess = async () => {
    if (!report) return;
    try {
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
      onResolve();
      onClose();
    } catch (e) {
      // Error handled silently
      toast.error('신고 상태를 업데이트하지 못했습니다.');
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'File',
                accept: { [blob.type]: ['.' + (filename.split('.').pop() || 'dat')] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (pickerError: any) {
          if (pickerError.name === 'AbortError') return;
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Error handled silently
      window.open(url, '_blank');
    }
  };

  const handleViewHistory = async (profileId: string, profileName: string) => {
    try {
      const toastId = toast.loading('상세 히스토리 조회 중...');

      // 1. Sanctions (이용제한 내역)
      const { data: sanctions } = await supabase
        .from('sanction_history')
        .select('*')
        .eq('target_user_id', profileId)
        .order('created_at', { ascending: false });

      // 2. Reports (신고 내역) - Use RPC for complete history (Direct User + All Content)
      const { data: allReceivedReports, error: reportError } = await supabase.rpc(
        'get_user_related_reports',
        { target_profile_id: profileId },
      );

      if (reportError) throw reportError;

      // 3. Reports Sent (작성한 신고)
      const { data: reportsSent } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', profileId)
        .order('created_at', { ascending: false });

      setDetailStack(prev => [
        ...prev,
        {
          type: 'user_history',
          id: 'history-' + profileId,
          profileId,
          profileName,
          sanctions: sanctions || [],
          reportsReceived: allReceivedReports,
          reportsSent: reportsSent || [],
        } as any,
      ]);
      toast.dismiss(toastId);
    } catch (e) {
      // Error handled silently
      toast.error('히스토리 로딩 실패');
    }
  };

  const handleViewChatHistory = async (chatId: string) => {
    if (!chatId || chatId === 'undefined') {
      toast.error('채팅방 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const toastId = toast.loading('채팅 내역을 불러오는 중...');
      const { data: allMsgs, error } = await supabase
        .from('direct_messages')
        .select('*, attachments:direct_message_attachments(*)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (allMsgs && allMsgs.length > 0) {
        const senderIds = Array.from(new Set(allMsgs.map(m => m.sender_id)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', senderIds);

        const enriched = allMsgs.map(m => ({
          ...m,
          sender: profiles?.find(p => p.user_id === m.sender_id),
        }));

        setDetailStack(prev => [
          ...prev,
          {
            type: 'chat_full_history',
            id: 'chat-history-' + chatId,
            messages: enriched,
            chatId,
          } as any,
        ]);
        toast.success('채팅 내역을 불러왔습니다.');
      } else {
        toast.error('채팅 내역이 없습니다.');
      }
      toast.dismiss(toastId);
    } catch (e) {
      // Error handled silently
      toast.error('채팅 내역 로딩 실패');
    }
  };

  // Reusable function to render chat messages
  const renderChatMessage = (msg: any, isReporter: boolean, isHighlighter: boolean = false) => {
    // Modified: Check if deleted BUT we want to show it for admin with a style change
    // If msg.deleted_at is set, it is deleted.
    const isDeleted = msg.deleted_at || msg.content === '관리자에 의해 삭제된 메시지입니다.';

    // Hide messages with no content (deleted or invalid)
    // Use a stricter check for content existence, replacing invisible characters
    const cleanContent = msg.content
      ? msg.content.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
      : '';
    const hasContent = cleanContent.length > 0;
    const hasAttachments =
      msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return null;
    }

    return (
      <div key={msg.id} className="flex flex-col gap-1 w-full mb-4">
        {/* Highlight Banner if needed */}
        {isHighlighter && (
          <div className="flex justify-start mb-1">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <AlertTriangle size={10} /> 신고 대상
            </span>
          </div>
        )}

        <div className={`flex gap-2 items-start ${isReporter ? 'justify-end' : 'justify-start'}`}>
          {/* Left Avatar (for reported user or others) */}
          {!isReporter && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={msg.sender?.avatar_url} />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          )}

          <div
            className={`flex flex-col max-w-[70%] min-w-0 ${isReporter ? 'items-end' : 'items-start'}`}
          >
            {/* Sender Name & Time */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs font-medium text-muted-foreground">
                {msg.sender?.nickname}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {isDeleted && (
                <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                  삭제됨
                </span>
              )}
            </div>

            {/* Content Container - Wraps Text and Attachments */}
            <div
              className={`flex flex-col ${isReporter ? 'items-end' : 'items-start'} gap-1 w-full`}
            >
              {/* Text Content */}
              {hasContent && (
                <div
                  className={`px-3 py-2 rounded-2xl text-sm break-all whitespace-pre-wrap shadow-sm ${
                    isReporter
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : isHighlighter
                        ? 'bg-red-50 dark:bg-red-900/20 text-foreground border border-red-200 dark:border-red-800 rounded-tl-sm'
                        : isDeleted // Deleted Message Style
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-red-300 dark:border-red-800 rounded-tl-sm decoration-wavy'
                          : 'bg-secondary text-foreground rounded-tl-sm border border-transparent'
                  }`}
                >
                  {isDeleted ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-red-500 flex items-center gap-1 mb-1 border-b border-red-200 dark:border-red-800 pb-1">
                        <Trash2 size={10} /> 관리자에 의해 삭제된 메시지
                      </span>
                      <span className="opacity-70 line-through decoration-red-400/50">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              )}

              {/* Attachments */}
              {hasAttachments && (
                <div
                  className={`flex flex-wrap gap-1 ${hasContent ? 'mt-0.5' : ''} ${isReporter ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.attachments.map((att: any) => {
                    const fileUrl = att.url || att.file_url || '';
                    const fileName = att.name || att.file_name || 'File';
                    const fileType = att.type || att.file_type || '';
                    const isImage =
                      fileType === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
                    const isVideo = fileType === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(fileUrl);

                    return (
                      <div
                        key={att.id || Math.random()}
                        className={`overflow-hidden rounded-xl border ${isHighlighter ? 'border-red-200 dark:border-red-800' : 'border-border shadow-sm'}`}
                      >
                        {isImage && (
                          <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-[240px] max-h-[240px] w-full object-cover cursor-zoom-in hover:opacity-95 transition-opacity bg-secondary/20"
                            onClick={() => setSelectedMediaId(fileUrl)}
                          />
                        )}
                        {isVideo && (
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => setSelectedMediaId(fileUrl)}
                          >
                            <div className="bg-black rounded-lg overflow-hidden max-w-[240px]">
                              <video src={fileUrl} className="max-w-full max-h-[240px]" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm">
                                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {!isImage && !isVideo && (
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              handleDownload(fileUrl, fileName);
                            }}
                            className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                              isReporter
                                ? 'bg-primary/5 hover:bg-primary/10 text-primary'
                                : 'bg-secondary/50 hover:bg-secondary text-foreground'
                            }`}
                          >
                            <div className="p-1.5 bg-background rounded-md shadow-sm">
                              <LinkIcon size={14} />
                            </div>
                            <span className="truncate max-w-[150px] font-medium">{fileName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Avatar (for reporter) */}
          {isReporter && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={msg.sender?.avatar_url} />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    );
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
      {/* Sanction Dialog */}
      <SanctionDialog
        isOpen={showBanDialog}
        onClose={() => setShowBanDialog(false)}
        mode={sanctionMode}
        targetUser={(() => {
          if (report.target_type === 'user') {
            return {
              id: targetData?.user_id || report.target_id,
              profile_id: targetData?.id || report.target_id, // For user reports, target_id is often the profile ID
              nickname: targetData?.nickname || 'Unknown',
            };
          }
          // For tweet/reply/chat, get the author
          const profile = targetData?.profiles || targetData?.sender;
          if (profile) {
            return {
              id: profile.user_id || profile.id,
              profile_id: profile.id,
              nickname: profile.nickname,
            };
          }
          return null;
        })()}
        onSuccess={handleSanctionSuccess}
        reportId={report.id}
      />

      {/* Dismiss Confirmation Dialog */}
      {showDismissDialog && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Shield className="text-gray-500" /> 신고 기각
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              해당 신고를 기각하시겠습니까? <br />
              기각된 신고는 '기각됨' 상태로 변경되며, 별도의 이용 제한 조치가 이루어지지 않습니다.
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
              해당 콘텐츠를 삭제하시겠습니까? <br />
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
        <div className="w-full h-[40%] md:h-full md:w-[320px] lg:w-[360px] shrink-0 bg-secondary/50 p-6 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
          <div className="space-y-6">
            {/* Status & Type */}
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} />
                {report.status === 'pending'
                  ? '대기 중'
                  : report.status === 'resolved'
                    ? '처리됨'
                    : report.status === 'dismissed'
                      ? '기각됨'
                      : report.status}
              </span>
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {report.target_type === 'tweet'
                  ? '트윗'
                  : report.target_type === 'reply'
                    ? '답글'
                    : report.target_type === 'user'
                      ? '사용자'
                      : report.target_type === 'chat'
                        ? '채팅'
                        : report.target_type}
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
              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                신고 당사자 정보
              </h4>
              <div className="flex flex-col gap-3">
                {/* Reporter */}
                <div
                  onClick={() => {
                    if (fetchedReporter) {
                      setDetailStack(prev => [
                        ...prev,
                        {
                          ...fetchedReporter,
                          id: fetchedReporter.id,
                          type: 'user',
                          // Make sure to adapt properties if needed for base item, but type 'user' is special
                        },
                      ]);
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
                      <p className="text-xs text-muted-foreground font-bold uppercase mb-0.5">
                        신고자
                      </p>
                      {fetchedReporter && (
                        <i className="ri-external-link-line text-xs opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </div>
                    <p className="text-sm font-bold truncate">
                      {report.reporter?.nickname || 'Unknown'}
                    </p>

                    {/* Detailed Info (Age, Gender, Country) */}
                    {(fetchedReporter?.countryName ||
                      fetchedReporter?.gender ||
                      fetchedReporter?.birthday) && (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                        {fetchedReporter.countryFlagUrl && (
                          <span className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                            <img
                              src={fetchedReporter.countryFlagUrl}
                              alt={fetchedReporter.countryName}
                              className="w-3.5 h-3.5 rounded-full object-cover"
                            />
                            <span>{fetchedReporter.countryName}</span>
                          </span>
                        )}
                        {fetchedReporter.gender && (
                          <span
                            className={`px-1.5 py-0.5 rounded border border-border/50 text-[10px] uppercase font-bold ${fetchedReporter.gender.toLowerCase() === 'male' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400'}`}
                          >
                            {translateGender(fetchedReporter.gender)}
                          </span>
                        )}
                        {fetchedReporter.birthday && (
                          <span className="bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                            {calculateAge(fetchedReporter.birthday)}세
                          </span>
                        )}
                      </div>
                    )}

                    {fetchedReporter && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleViewHistory(
                            fetchedReporter.id || fetchedReporter.user_id,
                            fetchedReporter.nickname,
                          );
                        }}
                        className="block text-[10px] text-muted-foreground hover:text-primary underline cursor-pointer mt-1"
                      >
                        <History size={10} className="inline mr-1" />
                        이용 제한/신고 기록 보기
                      </button>
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
                    <AvatarImage
                      src={
                        targetData?.profiles?.avatar_url ||
                        targetData?.sender?.avatar_url ||
                        targetData?.avatar_url
                      }
                    />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-500 dark:text-red-400 font-bold uppercase mb-0.5">
                      대상자 (피신고자)
                    </p>
                    <p className="text-sm font-bold truncate">
                      {targetData?.profiles?.nickname ||
                        targetData?.sender?.nickname ||
                        targetData?.nickname ||
                        'Loading...'}
                    </p>
                    {(() => {
                      const profile =
                        report.target_type === 'user'
                          ? targetData
                          : report.target_type === 'chat'
                            ? targetData?.sender
                            : targetData?.profiles;

                      return (
                        <>
                          {/* Ban Status Badge */}
                          {profile?.banned_until && new Date(profile.banned_until) > new Date() && (
                            <div className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 mb-1">
                              <Ban size={10} />
                              <span>
                                이용 제한 중 ({new Date(profile.banned_until).toLocaleDateString()}
                                까지)
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Detailed Info (Age, Gender, Country) */}
                    {(() => {
                      const profile =
                        report.target_type === 'user'
                          ? targetData
                          : report.target_type === 'chat'
                            ? targetData?.sender
                            : targetData?.profiles;

                      return profile ? (
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                          {targetData?.countryFlagUrl && (
                            <span className="flex items-center gap-1 bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                              <img
                                src={targetData.countryFlagUrl}
                                alt={targetData.countryName}
                                className="w-3.5 h-3.5 rounded-full object-cover"
                              />
                              <span>{targetData.countryName}</span>
                            </span>
                          )}
                          {profile.gender && (
                            <span
                              className={`px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30 text-[10px] uppercase font-bold ${profile.gender.toLowerCase() === 'male' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400'}`}
                            >
                              {translateGender(profile.gender)}
                            </span>
                          )}
                          {profile.birthday && (
                            <span className="bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                              {calculateAge(profile.birthday)}세
                            </span>
                          )}
                        </div>
                      ) : null;
                    })()}

                    {/* History Button (Moved below info) */}
                    {(() => {
                      const profile =
                        report.target_type === 'user'
                          ? targetData
                          : report.target_type === 'chat'
                            ? targetData?.sender
                            : targetData?.profiles;
                      return profile ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleViewHistory(profile.id || profile.user_id, profile.nickname);
                          }}
                          className="block text-[10px] text-muted-foreground hover:text-primary underline cursor-pointer mt-0.5"
                        >
                          <History size={10} className="inline mr-1" />
                          이용 제한/신고 기록 보기
                        </button>
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
                {new Date(report.created_at).toLocaleString('ko-KR')}(
                {formatRelativeTime(report.created_at)})
              </span>
            </div>

            {/* Actions Panel (Left Side on Desktop) */}
            <div className="space-y-2 pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                관리자 조치
              </h4>
              <button
                onClick={() => handleAction('dismiss')}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-border hover:bg-secondary transition text-sm font-medium"
              >
                <Shield size={16} /> 신고 기각
              </button>
              {(report.target_type === 'tweet' ||
                report.target_type === 'reply' ||
                report.target_type === 'chat') && (
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
                <Ban size={16} /> 사용자 이용 제한
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
              <div className="shrink-0 bg-secondary border-b border-border p-3 flex items-center gap-2">
                <button
                  onClick={() => setDetailStack(prev => prev.slice(0, -1))}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <ChevronLeft size={18} />
                  {detailStack.length > 1 ? '뒤로' : '신고 내역으로'}
                </button>
                <span className="text-xs text-muted-foreground ml-auto">상세 보기</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-background p-4">
                {(() => {
                  const item = detailStack[detailStack.length - 1];

                  // Handle User History View
                  if ((item as any).type === 'user_history') {
                    const h = item as any;
                    return (
                      <div className="h-full overflow-y-auto p-4 space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <History size={20} /> {h.profileName}님의 상세 기록
                        </h3>

                        {/* Sanctions */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-red-600 uppercase flex items-center gap-2">
                            <Ban size={14} /> 이용 제한 내역 ({h.sanctions.length})
                          </h4>
                          {h.sanctions.length > 0 ? (
                            <div className="bg-white dark:bg-gray-800 border border-border rounded-lg overflow-hidden">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-secondary text-muted-foreground font-medium border-b border-border">
                                  <tr>
                                    <th className="p-2">유형</th>
                                    <th className="p-2">기간</th>
                                    <th className="p-2">사유</th>
                                    <th className="p-2">날짜</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {h.sanctions.map((s: any) => (
                                    <tr key={s.id}>
                                      <td className="p-2 font-bold text-red-500">
                                        {s.sanction_type === 'permanent_ban'
                                          ? '영구 이용 제한'
                                          : '이용 제한'}
                                      </td>
                                      <td className="p-2">
                                        {s.duration_days ? `${s.duration_days}일` : '무기한'}
                                      </td>
                                      <td className="p-2 truncate max-w-[100px]" title={s.reason}>
                                        {s.reason}
                                      </td>
                                      <td className="p-2 text-muted-foreground">
                                        {new Date(s.created_at).toLocaleDateString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                              이용 제한 기록이 없습니다.
                            </div>
                          )}
                        </div>

                        {/* Reports Received */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-orange-600 uppercase flex items-center gap-2">
                            <AlertTriangle size={14} /> 받은 신고 ({h.reportsReceived.length})
                          </h4>
                          {h.reportsReceived.length > 0 ? (
                            <div className="space-y-2">
                              {h.reportsReceived.map((r: any) => (
                                <div
                                  key={r.id}
                                  onClick={() =>
                                    setDetailStack(prev => [
                                      ...prev,
                                      { ...r, type: 'report_detail' } as any,
                                    ])
                                  }
                                  className="bg-white dark:bg-gray-800 border border-border rounded-lg p-3 text-sm cursor-pointer hover:bg-secondary/50 transition-colors group"
                                >
                                  <div className="flex justify-between mb-1">
                                    <span className="font-bold text-orange-500 flex items-center gap-1">
                                      {String(t(`report.reasons.${r.reason}`, r.reason))}
                                      <i className="ri-arrow-right-s-line opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] uppercase">
                                      {r.target_type === 'tweet'
                                        ? '트윗'
                                        : r.target_type === 'reply'
                                          ? '답글'
                                          : r.target_type === 'chat'
                                            ? '채팅'
                                            : '사용자'}
                                    </span>
                                    {r.description && (
                                      <span className="truncate max-w-[200px]">
                                        {r.description}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2 text-xs flex gap-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-medium ${
                                        r.status === 'resolved'
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                          : r.status === 'dismissed'
                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      }`}
                                    >
                                      {r.status === 'resolved'
                                        ? '처리됨'
                                        : r.status === 'dismissed'
                                          ? '기각됨'
                                          : '대기 중'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                              받은 신고 내역이 없습니다.
                            </div>
                          )}
                        </div>

                        {/* Reports Sent */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-blue-600 uppercase flex items-center gap-2">
                            <Shield size={14} /> 작성한 신고 ({h.reportsSent.length})
                          </h4>
                          {h.reportsSent.length > 0 ? (
                            <div className="space-y-2">
                              {h.reportsSent.map((r: any) => (
                                <div
                                  key={r.id}
                                  onClick={() =>
                                    setDetailStack(prev => [
                                      ...prev,
                                      { ...r, type: 'report_detail' } as any,
                                    ])
                                  }
                                  className="bg-white dark:bg-gray-800 border border-border rounded-lg p-3 text-sm cursor-pointer hover:bg-secondary/50 transition-colors"
                                >
                                  <div className="flex justify-between mb-1">
                                    <span className="font-bold text-blue-500">
                                      {String(t(`report.reasons.${r.reason}`, r.reason))}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] uppercase">
                                      대상:{' '}
                                      {r.target_type === 'tweet'
                                        ? '트윗'
                                        : r.target_type === 'reply'
                                          ? '답글'
                                          : r.target_type === 'chat'
                                            ? '채팅'
                                            : '사용자'}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-xs flex gap-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-medium ${
                                        r.status === 'resolved'
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                          : r.status === 'dismissed'
                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      }`}
                                    >
                                      {r.status === 'resolved'
                                        ? '처리됨'
                                        : r.status === 'dismissed'
                                          ? '기각됨'
                                          : '대기 중'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                              작성한 신고 내역이 없습니다.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Handle Report Detail View
                  if ((item as any).type === 'report_detail') {
                    return (
                      <HistoryReportDetailView
                        report={item}
                        onViewChatHistory={handleViewChatHistory}
                        onItemClick={clickedItem => setDetailStack(prev => [...prev, clickedItem])}
                      />
                    );
                  }

                  // Handle Full Chat History View
                  if ((item as any).type === 'chat_full_history') {
                    const chatItems = item as any;
                    return (
                      <div className="h-full flex flex-col bg-background">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-white dark:bg-black sticky top-0 z-10">
                          <h3 className="font-bold flex items-center gap-2">
                            <MessageSquare size={18} className="text-primary" />
                            채팅 내역 전체 보기
                          </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                          {chatItems.messages.map((msg: any) =>
                            renderChatMessage(msg, false, false),
                          )}
                        </div>
                      </div>
                    );
                  }

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
                      joinDate: p.created_at
                        ? new Date(p.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '',
                      followers: p.followers_count || 0,
                      following: p.following_count || 0,
                      banner: p.banner_url,
                      bannerPositionY: p.banner_position_y,
                      country: p.countryName || p.country, // Ensure name is passed
                      countryFlagUrl: p.countryFlagUrl,
                      gender: p.gender,
                      age: calculateAge(p.birthday),
                    };

                    return (
                      <div className="h-full">
                        <div className="mb-4">
                          <ProfileHeader
                            userProfile={userP}
                            isOwnProfile={false}
                            hideFollowButton={true}
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
                                onItemClick={async item => {
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

                  return (item as any).type === 'chat' ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <i className="ri-chat-1-line text-2xl text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">채팅방 상세 보기</h3>
                      <p className="mb-4">전체 채팅 내역은 채팅 페이지에서 확인할 수 있습니다.</p>
                      <button
                        onClick={() => {
                          const chatId = (item as any).target_id || (item as any).chat_id;
                          if (chatId && chatId !== 'undefined') {
                            handleViewChatHistory(chatId);
                          } else {
                            toast.error('채팅방 ID를 확인할 수 없습니다.');
                          }
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                      >
                        전체 채팅 내역 보기
                      </button>
                    </div>
                  ) : item.type === 'reply' ? (
                    <div className="max-w-2xl mx-auto">
                      <ReplyCard
                        key={'detail-' + item.id}
                        reply={
                          {
                            ...item,
                            timestamp: item.timestamp || (item as any).created_at || item.createdAt,
                          } as UIReply
                        }
                        highlight={false}
                        disableInteractions={true}
                        onClick={(id, tid) => {
                          setDetailStack(prev => [...prev, { ...item, type: 'reply' } as any]);
                        }}
                        editingReplyId={null} // 수정 모드 아님을 명시
                        setEditingReplyId={() => {}} // 빈 함수 전달로 타입 충족
                      />
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto pb-10">
                      <TweetCard
                        key={'detail-' + item.id}
                        {...item}
                        user={
                          item.user || {
                            id: 'unknown',
                            name: 'Unknown',
                            username: 'unknown',
                            avatar: '',
                          }
                        }
                        onClick={id => {
                          /* Already deep */
                        }}
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
                                editingReplyId={null} // 수정 모드 아님을 명시
                                setEditingReplyId={() => {}} // 빈 함수 전달로 타입 충족
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
                const profile =
                  report.target_type === 'user'
                    ? targetData
                    : report.target_type === 'chat'
                      ? targetData.sender
                      : targetData.profiles;

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
                                id: targetData.profiles?.id || 'unknown',
                                username: targetData.profiles?.user_id || 'unknown',
                                name: targetData.profiles?.nickname || 'Unknown',
                                avatar: targetData.profiles?.avatar_url || '',
                              }}
                              content={targetData.content}
                              image={targetData.image_urls}
                              timestamp={targetData.created_at}
                              createdAt={targetData.created_at}
                              stats={{
                                likes: targetData.like_count || 0,
                                replies: targetData.reply_count || 0,
                                retweets: 0,
                                views: targetData.view_count || 0,
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
                                  id: targetData.profiles?.id || 'unknown',
                                  username: targetData.profiles?.user_id || 'unknown',
                                  name: targetData.profiles?.nickname || 'Unknown',
                                  avatar: targetData.profiles?.avatar_url || '',
                                },
                                content: targetData.content,
                                timestamp: targetData.created_at,
                                createdAt: targetData.created_at,
                                stats: {
                                  likes: targetData.like_count || 0,
                                  replies: targetData.reply_count || 0,
                                  retweets: 0,
                                  views: targetData.view_count || 0,
                                },
                                liked: false,
                              }}
                              highlight={true}
                              onClick={(id, tweetId) => handleReplyClick(id, tweetId)}
                              disableInteractions={true}
                              editingReplyId={null} // 수정 모드 아님을 명시
                              setEditingReplyId={() => {}} // 빈 함수 전달로 타입 충족
                            />
                          </div>
                        </div>
                      )}

                      {report.target_type === 'chat' && (
                        <div className="space-y-4">
                          {/* Reported Messages Section */}
                          {reportedMessages.length > 0 ? (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-red-500 uppercase">
                                신고된 메시지 ({reportedMessages.length})
                              </h4>
                              <div className="bg-background border border-border rounded-xl p-4 max-h-[400px] overflow-y-auto">
                                {reportedMessages.map(msg => renderChatMessage(msg, false, true))}
                              </div>
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
                                    if (targetData?.id && targetData.id !== 'undefined') {
                                      handleViewChatHistory(targetData.id);
                                    } else {
                                      toast.error('채팅방 정보를 불러올 수 없습니다.');
                                    }
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                  전체 채팅방 보기
                                </button>
                              </div>
                              <div className="space-y-1 pl-4 border-l-2 border-border/50 ml-2 max-h-96 overflow-y-auto">
                                {contextData.map((msg: any) =>
                                  renderChatMessage(msg, false, false),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {report.target_type === 'user' && (
                        <div className="flex items-center justify-center p-4 bg-secondary/30 rounded-xl text-sm text-muted-foreground">
                          <User size={16} className="mr-2" /> 계정 신고 - 하단 프로필 및 활동 내역을
                          참고하세요.
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
                          joinDate: new Date(profile.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }),
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
                        onItemClick={async item => {
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
      {showFullChat &&
        report?.target_type === 'chat' &&
        (fullChatMessages.length > 0 ? fullChatMessages : contextData) &&
        (() => {
          const messages = fullChatMessages.length > 0 ? fullChatMessages : contextData;
        })()}

      {/* Lightbox / Media Zoom Overlay */}
      <MediaViewer
        isOpen={!!selectedMediaId}
        onClose={() => setSelectedMediaId(null)}
        mediaList={mediaList}
        initialMediaId={selectedMediaId || undefined}
      />
    </Modal>
  );
}

export const HistoryReportDetailView = ({
  report,
  onViewChatHistory,
  onItemClick,
}: {
  report: any;
  onViewChatHistory: (id: string) => void;
  onItemClick?: (item: any) => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [usingSnapshot, setUsingSnapshot] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      // 1. Try to use Snapshot first
      if (report.content_snapshot) {
        // Ensure the type is set correctly based on report target_type
        // Snapshot data structure matches TweetCard/ReplyCard props
        setContent({ ...report.content_snapshot, type: report.target_type });
        setUsingSnapshot(true);
        return;
      }

      if (!report.target_id) return;
      setLoading(true);
      try {
        if (report.target_type === 'tweet') {
          const { data } = await supabase
            .from('tweets')
            .select('*, user:profiles(*)')
            .eq('id', report.target_id)
            .single();
          if (data) setContent({ ...data, type: 'tweet' });
        } else if (report.target_type === 'reply') {
          const { data } = await supabase
            .from('tweet_replies')
            .select('*, user:profiles(*)')
            .eq('id', report.target_id)
            .single();
          if (data) setContent({ ...data, type: 'reply' });
        } else if (report.target_type === 'direct_message') {
          const { data } = await supabase
            .from('direct_messages')
            .select('*, user:profiles(*), attachments:direct_message_attachments(*)')
            .eq('id', report.target_id)
            .single();
          if (data) setContent({ ...data, type: 'direct_message' });
        } else if (report.target_type === 'chat') {
          // For chat room reports, we just need the room ID to link to.
          // We can fetch room details if needed, or just set content with ID.
          setContent({ chat_id: report.target_id, type: 'chat', created_at: report.created_at });
        }
      } catch (e) {
        // Error handled silently
      }
      setLoading(false);
    };
    fetchContent();
  }, [report]);

  return (
    <div className="h-full overflow-y-auto p-4 bg-background">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-orange-500" /> 신고 상세 정보
      </h3>

      <div className="space-y-4">
        {/* Metadata Card */}
        <div className="bg-secondary/30 p-4 rounded-xl border border-border space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">신고 사유</span>
              <p className="font-bold text-lg text-orange-600">
                {String(t(`report.reasons.${report.reason}`, report.reason))}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>
          {report.description && (
            <div className="bg-background p-3 rounded-lg text-sm italic text-muted-foreground border border-border whitespace-pre-wrap">
              "{report.description}"
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-xs font-bold px-2 py-1 rounded bg-secondary text-muted-foreground uppercase">
              {report.target_type === 'tweet'
                ? '트윗'
                : report.target_type === 'reply'
                  ? '답글'
                  : report.target_type === 'chat'
                    ? '채팅'
                    : '사용자'}
            </span>
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${
                report.status === 'resolved'
                  ? 'bg-green-100 text-green-700'
                  : report.status === 'dismissed'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {report.status === 'resolved'
                ? '처리됨'
                : report.status === 'dismissed'
                  ? '기각됨'
                  : '대기 중'}
            </span>
            {usingSnapshot && (
              <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                <History size={12} /> 스냅샷 데이터
              </span>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2">
              <Eye size={16} />
              {usingSnapshot ? '신고 당시 콘텐츠 (보존됨)' : '현재 콘텐츠 상태'}
            </span>
            {usingSnapshot && (
              <span className="text-xs font-normal text-muted-foreground">
                * 원본이 삭제되어도 표시됩니다.
              </span>
            )}
          </h4>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              콘텐츠 불러오는 중...
            </div>
          ) : content ? (
            <div className="opacity-95 scale-[0.98] origin-top">
              {/* Preview content */}
              {content.type === 'tweet' && (
                <TweetCard
                  {...content}
                  user={content.user || { name: 'Unknown', username: '', avatar: '' }}
                  onClick={() => onItemClick?.({ ...content, type: 'tweet' })}
                  disableInteractions={true}
                />
              )}
              {content.type === 'reply' && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <ReplyCard
                    reply={{
                      ...content,
                      user: content.user || { name: 'Unknown', username: '', avatar: '' },
                      stats: content.stats || { likes: 0, replies: 0 },
                    }}
                    onClick={(id, tid) =>
                      onItemClick?.({ ...content, type: 'reply', tweetId: tid })
                    }
                    highlight={true}
                    disableInteractions={true}
                    editingReplyId={null} // 수정 모드 아님을 명시
                    setEditingReplyId={() => {}} // 빈 함수 전달로 타입 충족
                  />
                </div>
              )}
              {content.type === 'direct_message' && (
                <div className="border border-border rounded-xl p-4 bg-secondary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={content.user?.avatar_url} />
                      <AvatarFallback>{content.user?.nickname?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-sm">{content.user?.nickname}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(content.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-border mb-3">
                    {content.content}
                  </div>
                  {content.attachments && content.attachments.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {content.attachments.map((att: any) => (
                        <div key={att.id} className="text-xs bg-secondary p-1 rounded">
                          📎 첨부파일
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const cid =
                        content.chat_id ||
                        (content as any).chatId ||
                        (report.target_type === 'chat' ? report.target_id : null);
                      if (cid && cid !== 'undefined') onViewChatHistory(cid);
                      else toast.error('채팅방 ID를 찾을 수 없습니다.');
                    }}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="ri-chat-1-line" /> 전체 채팅방 보기
                  </button>
                </div>
              )}
              {content.type === 'chat' && (
                <div className="border border-border rounded-xl p-4 bg-secondary/10 text-center">
                  <div className="bg-primary/10 p-3 rounded-full inline-block mb-3">
                    <i className="ri-chat-1-line text-2xl text-primary" />
                  </div>
                  <h4 className="font-bold text-sm mb-2">채팅방 신고</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    신고된 채팅방입니다. 버튼을 눌러 전체 대화 내용을 확인하세요.
                  </p>
                  <button
                    onClick={() => {
                      const cid =
                        content.chat_id ||
                        (content as any).chatId ||
                        content.id ||
                        report.target_id;
                      if (cid && cid !== 'undefined') onViewChatHistory(cid);
                      else toast.error('채팅방 ID를 찾을 수 없습니다.');
                    }}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="ri-message-line" /> 채팅방 전체 보기
                  </button>
                </div>
              )}
            </div>
          ) : report.target_type === 'user' ? (
            <div className="text-sm text-muted-foreground p-4 bg-secondary/20 rounded-lg text-center">
              사용자 프로필 신고입니다.
            </div>
          ) : (
            <div className="text-sm text-red-500 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-center border border-red-100 dark:border-red-900/30">
              <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
              삭제되었거나 찾을 수 없는 콘텐츠입니다.
              <br />
              <span className="text-xs opacity-75">
                (스냅샷이 없는 과거 신고 내역일 수 있습니다)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
