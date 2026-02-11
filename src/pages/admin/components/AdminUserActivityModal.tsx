import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/common/Modal';
import { 
  Loader2, 
  FileText, 
  MessageSquare, 
  MessagesSquare, 
  Ban, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  X,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  User as UserIcon,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';
import { BanBadge } from '@/components/common/BanBadge';
import TweetDetailCard from '@/pages/community/tweet/components/TweetDetailCard';
import { ReplyCard } from '@/pages/community/tweet/components/ReplyCard';
import type { UIPost, UIReply } from '@/types/sns';
import { tweetService } from '@/services/tweetService';
import ModalImageSlider from '@/pages/community/tweet/components/ModalImageSlider';
import ImageSlider from '@/pages/community/tweet/components/ImageSlider';
import MediaViewer, { type MediaItem } from '@/components/chat/direct/MediaViewer';
import TranslateButton from '@/components/common/TranslateButton';
import UserProfileModal from './UserProfileModal';
import { formatMessageTime, formatDividerDate, formatSmartDate } from '@/utils/dateUtils';
import HighlightText from '@/components/common/HighlightText';
import { useTranslation } from 'react-i18next';

interface AdminUserActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; profile_id: string; nickname: string } | null;
}

type Tab = 'tweets' | 'replies' | 'likes' | 'chats';

// Helper Component for Chat Message Item to handle local state (translation)
const ChatMessageItem = ({ 
    msg, 
    user, 
    selectedChat, 
    onOpenMediaViewer, 
    onDownload,
    formatMessageTime
}: any) => {
    const [translated, setTranslated] = useState<string>('');
    const targetUId = user?.profile_id || user?.id;
    const isMyMessage = msg.sender_id === targetUId || (msg.sender && (msg.sender.id === targetUId || msg.sender.user_id === user?.id));
    const sender = msg.sender || [selectedChat.user1, selectedChat.user2].find((u: any) => u && (u.id === msg.sender_id || u.user_id === msg.sender_id)) || null;
    
    const isDeleted = !!msg.deleted_at || msg.content === '관리자에 의해 삭제된 메시지입니다.';
    const cleanContent = msg.content ? msg.content.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() : '';
    const hasContent = cleanContent.length > 0;
    const attachments = msg.attachments || [];
    const hasAttachments = attachments.length > 0;

    if (!hasContent && !hasAttachments) return null;

    return (
        <div key={msg.id} className={`flex flex-col gap-1 w-full mb-4 ${isMyMessage ? 'items-end' : 'items-start'}`}>
            <div className={`flex gap-2 items-start ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={sender?.avatar_url || '/images/default-avatar.svg'} />
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col max-w-[70%] min-w-0 ${isMyMessage ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1 px-1 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{sender?.nickname || '알 수 없음'}</span>
                        <span className="text-[10px] text-zinc-400">{formatMessageTime(msg.created_at)}</span>
                        {isDeleted && (
                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">삭제됨</span>
                        )}
                    </div>

                    <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} gap-1 w-full`}>
                        {(hasContent || (hasAttachments && isDeleted)) && (
                            <div className={`flex items-center gap-2 group ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`px-3 py-2 rounded-2xl text-sm break-all whitespace-pre-wrap shadow-sm ${
                                    isMyMessage 
                                        ? 'bg-primary text-white rounded-tr-sm' 
                                        : isDeleted 
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-red-300 dark:border-red-800 rounded-tl-sm'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-tl-sm border border-transparent'
                                }`}>
                                    {isDeleted ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mb-1 border-b border-red-200 dark:border-red-800 pb-1">
                                                <Trash2 size={10} /> 관리자에 의해 삭제된 메시지
                                            </span>
                                            <span className="opacity-70 line-through decoration-red-400/50">{msg.content || '(이미지/파일 포함)'}</span>
                                        </div>
                                    ) : (
                                        <HighlightText text={msg.content || ''} />
                                    )}
                                </div>
                                {!isMyMessage && hasContent && !isDeleted && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TranslateButton
                                            text={msg.content || ''}
                                            contentId={`adm_dm_${msg.id}`}
                                            setTranslated={setTranslated}
                                            size="sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {translated && (
                            <div className="mt-1 p-2 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 max-w-full">
                                <p className="font-bold text-[10px] text-primary mb-1 uppercase tracking-tighter">Translation</p>
                                {translated}
                            </div>
                        )}

                        {hasAttachments && !isDeleted && (
                            <div className={`flex flex-wrap gap-1 ${hasContent ? 'mt-1' : ''} ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                {attachments.map((att: any, attIdx: number) => {
                                    const fileUrl = att.url || att.file_url || '';
                                    const fileName = att.name || att.file_name || 'File';
                                    const fileType = (att.type || att.file_type || '').toLowerCase();
                                    const isImage = fileType === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
                                    const isVideo = fileType === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(fileUrl);

                                    return (
                                        <div key={att.id || attIdx} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-900 transition-all">
                                            {isImage && (
                                                <img 
                                                    src={fileUrl} 
                                                    alt={fileName}
                                                    className="max-w-[240px] max-h-[240px] w-full object-cover cursor-pointer hover:opacity-95 transition-opacity bg-zinc-50 dark:bg-zinc-900"
                                                    onClick={() => onOpenMediaViewer(fileUrl)}
                                                />
                                            )}
                                            {isVideo && (
                                                <div className="relative group cursor-pointer" onClick={() => onOpenMediaViewer(fileUrl)}>
                                                    <div className="bg-black rounded-lg overflow-hidden max-w-[240px]">
                                                        <video src={fileUrl} className="max-w-full max-h-[240px]" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm">
                                                                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {!isImage && !isVideo && (
                                                <div 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDownload(fileUrl, fileName);
                                                    }}
                                                    className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                                                        isMyMessage ? 'bg-primary/5 hover:bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                                                    }`}
                                                >
                                                    <FileText size={18} />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="truncate max-w-[150px] font-medium">{fileName}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminUserActivityModal: React.FC<AdminUserActivityModalProps> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('tweets');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [detailStack, setDetailStack] = useState<any[]>([]);
  const [targetReplyId, setTargetReplyId] = useState<string | null>(null);
  const [likesPage, setLikesPage] = useState(0);
  const [hasMoreLikes, setHasMoreLikes] = useState(true);
  const [allLikedItems, setAllLikedItems] = useState<any[]>([]);
  const [itemReplies, setItemReplies] = useState<any[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [initialMediaId, setInitialMediaId] = useState<string | undefined>(undefined);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const messageGroups = useMemo(() => {
    const groups: { [date: string]: any[] } = {};
    chatMessages.forEach((msg) => {
      const date = formatDividerDate(msg.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  }, [chatMessages]);

  useEffect(() => {
    if (!selectedChat || chatMessages.length === 0) {
      setMediaList([]);
      return;
    }

    const media: MediaItem[] = [];
    chatMessages.forEach(msg => {
      const isDeleted = !!msg.deleted_at || msg.content === '관리자에 의해 삭제된 메시지입니다.';
      if (msg.attachments && msg.attachments.length > 0 && !isDeleted) {
        msg.attachments.forEach((att: any) => {
          const type = (att.type || att.file_type || '').toLowerCase();
          const url = att.url || att.file_url;
          if (!url) return;

          const sender = [selectedChat.user1, selectedChat.user2].find(u => u && (u.id === msg.sender_id || u.user_id === msg.sender_id)) || msg.sender;

          if (type === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(url)) {
            media.push({
              url,
              messageId: msg.id,
              date: msg.created_at,
              senderId: msg.sender_id,
              senderName: sender?.nickname || 'Unknown',
              senderAvatarUrl: sender?.avatar_url,
              type: 'video'
            });
          } else if (type !== 'file' && (type === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url))) {
            media.push({
              url,
              messageId: msg.id,
              date: msg.created_at,
              senderId: msg.sender_id,
              senderName: sender?.nickname || 'Unknown',
              senderAvatarUrl: sender?.avatar_url,
              type: 'image'
            });
          }
        });
      }
    });
    setMediaList(media);
  }, [chatMessages, selectedChat]);

  useEffect(() => {
    if (activeTab === 'chats' && chatMessages.length > 0) {
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [chatMessages, activeTab, selectedChat]);

  const handleChatScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    // 바닥에서 200px 이상 떨어지면 버튼 표시
    setShowScrollDownBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = (smooth = true) => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  const currentItem = detailStack.length > 0 ? detailStack[detailStack.length - 1] : null;

  const fetchCounts = async () => {
    if (!user) return;
    try {
      const { data: res } = await supabase.rpc('get_user_activity_counts', { target_uid: user.id });
      
      // Fallback for likes if RPC is not updated yet
      if (res && res.tweet_likes_count === undefined) {
          const [{ count: tLikes }, { count: rLikes }] = await Promise.all([
              supabase.from('tweet_likes').select('*', { count: 'exact', head: true }).eq('user_id', user.profile_id),
              supabase.from('tweet_replies_likes').select('*', { count: 'exact', head: true }).eq('user_id', user.profile_id)
          ]);
          setCounts({
              ...res,
              tweet_likes_count: tLikes || 0,
              reply_likes_count: rLikes || 0
          });
      } else {
          setCounts(res);
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query;
      if (activeTab === 'tweets') {
        query = supabase.from('tweets').select('*, profiles:author_id(nickname, avatar_url, user_id)').eq('author_id', user.profile_id).order('created_at', { ascending: false });
      } else if (activeTab === 'replies') {
        query = supabase
          .from('tweet_replies')
          .select('*, profiles:author_id(nickname, avatar_url, banned_until, user_id), tweets(profiles:author_id(nickname, user_id))')
          .eq('author_id', user.profile_id)
          .order('created_at', { ascending: false });
      } else if (activeTab === 'likes') {
          fetchLikes(0);
          return;
      } else {
        query = supabase.from('direct_chats').select(`
          *,
          user1:profiles!direct_chats_user1_id_fkey(id, nickname, avatar_url, user_id),
          user2:profiles!direct_chats_user2_id_fkey(id, nickname, avatar_url, user_id)
        `).or(`user1_id.eq.${user.profile_id},user2_id.eq.${user.profile_id}`).order('last_message_at', { ascending: false });
      }

      const { data: res, error } = await query;
      if (error) throw error;
      setData(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikes = async (page: number, refresh = true) => {
    if (!user) return;
    setLoading(true);
    try {
        const { items, allLikedItems: totalLikes } = await tweetService.getLikedItems(user.profile_id, page, refresh ? [] : allLikedItems);
        if (refresh) {
            setData(items);
            setAllLikedItems(totalLikes);
        } else {
            setData(prev => [...prev, ...items]);
        }
        setHasMoreLikes(items.length === 10);
        setLikesPage(page);
    } catch (err) {
        console.error('Error fetching likes:', err);
        toast.error('좋아요 목록을 불러오지 못했습니다.');
    } finally {
        setLoading(false);
    }
  };

  const fetchChatMessages = async (chatId: string) => {
    setChatLoading(true);
    try {
      const { data: res, error } = await supabase
        .from('direct_messages')
        .select(`
            *,
            attachments:direct_message_attachments(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const messages = res || [];
      if (messages.length > 0) {
          const senderIds = Array.from(new Set(messages.map(m => m.sender_id).filter(Boolean)));
          // Fetch profiles by both id and user_id to be extremely safe
          const { data: profiles } = await supabase.from('profiles')
            .select('id, nickname, avatar_url, user_id')
            .or(`id.in.(${senderIds.map(id => `"${id}"`).join(',')}),user_id.in.(${senderIds.map(id => `"${id}"`).join(',')})`);
          
          const enriched = messages.map(m => ({
              ...m,
              sender: profiles?.find(p => p.id === m.sender_id || p.user_id === m.sender_id)
          }));
          setChatMessages(enriched);
      } else {
          setChatMessages([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('채팅 내용을 불러오지 못했습니다.');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChat && !chatLoading && chatMessages.length > 0) {
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [selectedChat?.id, chatLoading]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('tweets');
      setDetailStack([]);
      setSelectedChat(null);
      if (user) {
        fetchCounts();
        fetchData();
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    setDetailStack([]);
    setSelectedChat(null);
    setItemReplies([]);
    setData([]); // Clear previous tab's data immediately
    if (isOpen && user) {
        fetchData();
    }
  }, [activeTab]);

  const mapToUIPost = (item: any): UIPost => {
    if (!item) return {} as UIPost;
    return {
      id: item.id,
      user: {
          id: item.profiles?.id || item.user?.id || item.author_id,
          name: item.profiles?.nickname || item.user?.name || '알 수 없음',
          username: item.profiles?.user_id || item.user?.username || '',
          avatar: item.profiles?.avatar_url || item.user?.avatar || '/images/default-avatar.svg',
          banned_until: item.profiles?.banned_until || item.user?.banned_until
      },
      content: item.content || '',
      image: item.image || item.image_url || [],
      timestamp: item.created_at || item.timestamp,
      stats: {
          replies: item.reply_count || item.stats?.replies || 0,
          retweets: item.repost_count || item.stats?.retweets || 0,
          likes: item.like_count || item.stats?.likes || 0,
          views: item.view_count || item.stats?.views || 0,
      },
      deleted_at: item.deleted_at
    };
  };

  const mapToUIReply = (item: any): UIReply => {
    const post = mapToUIPost(item);
    return {
      ...post,
      type: 'reply',
      tweetId: item.tweet_id,
      parentTweet: item.tweets?.author_id,
      parent_reply_id: item.parent_reply_id,
      root_reply_id: item.root_reply_id
    };
  };

  useEffect(() => {
    if (currentItem?.id && currentItem.id !== 'undefined') {
        const isRootTweet = !currentItem.tweet_id && !currentItem.parent_reply_id;
        if (isRootTweet) {
            fetchRepliesForTweet(currentItem.id);
        } else {
            fetchSubReplies(currentItem.id);
        }
    }
  }, [currentItem?.id]);

  const fetchRepliesForTweet = async (tweetId: string) => {
      if (!tweetId || tweetId === 'undefined') return;
      setRepliesLoading(true);
      try {
          const { data, error } = await supabase
            .from('tweet_replies')
            .select('*, profiles:author_id(nickname, avatar_url, banned_until, user_id), tweets(profiles:author_id(nickname, user_id))')
            .eq('tweet_id', tweetId)
            .is('parent_reply_id', null)
            .order('created_at', { ascending: true });
          if (!error) {
              const mapped = (data || []).map(mapToUIReply);
              setItemReplies(mapped);
          }

          if (targetReplyId) {
              const scrollTarget = () => {
                  const el = document.getElementById(`reply-${targetReplyId}`);
                  if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('bg-primary/5', 'ring-2', 'ring-primary/20');
                      setTimeout(() => el.classList.remove('bg-primary/5', 'ring-2', 'ring-primary/20'), 3000);
                      return true;
                  }
                  return false;
              };

              // Try several times as images/content might push the layout
              let attempts = 0;
              const interval = setInterval(() => {
                  if (scrollTarget() || attempts > 10) {
                      clearInterval(interval);
                  }
                  attempts++;
              }, 200);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setRepliesLoading(false);
      }
  };

  const fetchSubReplies = async (parentId: string) => {
    if (!parentId || parentId === 'undefined') return;
    setRepliesLoading(true);
    try {
      const { data, error } = await supabase
        .from('tweet_replies')
        .select('*, profiles:author_id(nickname, avatar_url, banned_until, user_id), parent:parent_reply_id(profiles:author_id(nickname, user_id))')
        .eq('parent_reply_id', parentId)
        .order('created_at', { ascending: true });
      if (!error) {
          const mapped = (data || []).map(mapToUIReply);
          setItemReplies(mapped);
      }
    } catch (err) {
      console.error('Error fetching sub-replies:', err);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleDeleteContent = async (id: string, isTweet: boolean) => {
      const table = isTweet ? 'tweets' : 'tweet_replies';
      if (!confirm('해당 콘텐츠를 삭제(Soft Delete) 하시겠습니까?')) return;
      try {
          const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id);
          if (error) throw error;
          toast.success('삭제되었습니다.');
          fetchData();
          if (currentItem?.id === id) setDetailStack(prev => prev.slice(0, -1));
      } catch (err) {
          console.error(err);
          toast.error('삭제 실패');
      }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const extractImages = (item: any) => {
    if (!item) return [];
    const images: string[] = [];

    // 1. From content (HTML)
    if (item.content) {
      const doc = new DOMParser().parseFromString(item.content, 'text/html');
      doc.querySelectorAll('img').forEach(img => {
        if (img.src) images.push(img.src);
      });
    }

    // 2. From image field (SNS format)
    if (item.image) {
      if (Array.isArray(item.image)) {
          images.push(...item.image);
      } else {
          images.push(item.image);
      }
    }

    // 3. From attachments field (Chat or newer SNS format)
    if (item.attachments && Array.isArray(item.attachments)) {
      item.attachments.forEach((att: any) => {
        if ((!att.type || att.type === 'image') && att.url) {
          images.push(att.url);
        }
      });
    }

    return [...new Set(images)].filter(Boolean);
  };

  const openLightbox = (images: any[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'File',
              accept: { [blob.type]: ['.' + (filename.split('.').pop() || 'dat')] },
            }],
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
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const openMediaViewer = (url: string) => {
    setInitialMediaId(url);
    setShowMediaViewer(true);
  };

  const pushToStack = async (item: any) => {
    const isReply = !!item.tweet_id || item.type === 'reply';

    if (isReply && item.tweet_id) {
        setLoading(true);
        setTargetReplyId(item.id);
        try {
            const { data: rootTweet, error } = await supabase
                .from('tweets')
                .select('*, profiles:author_id(nickname, avatar_url, banned_until, user_id)')
                .eq('id', item.tweet_id)
                .maybeSingle();

            if (rootTweet) {
                setDetailStack(prev => [...prev, rootTweet]);
                setItemReplies([]); 
                fetchRepliesForTweet(rootTweet.id);
            } else {
                toast.error('원본 게시글을 찾을 수 없습니다.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    } else {
        setTargetReplyId(null);
        setDetailStack(prev => [...prev, item]);
        if (item.id) {
            setItemReplies([]); 
            fetchRepliesForTweet(item.id);
        }
    }
  };

  const handleParentClick = async (tweetId: string) => {
      if (!tweetId || tweetId === 'undefined') return;
      try {
          const { data: tweet, error } = await supabase.from('tweets').select('*, profiles:author_id(nickname, avatar_url, user_id)').eq('id', tweetId).maybeSingle();
          if (error || !tweet) {
              toast.error('원본 게시글을 불러올 수 없습니다.');
              return;
          }
          pushToStack(tweet);
      } catch (err) {
          console.error(err);
      }
  };

  const ActivityListItem = ({ item, onClick, showLikeBadge = false }: { item: any, onClick: () => void, showLikeBadge?: boolean }) => {
    const isReply = item.type === 'reply' || !!(item.tweet_id || item.parent_reply_id);
    const images = extractImages(item);
    const mediaLabels = [];
    if (images.length > 0) mediaLabels.push('[사진]');

    const contentStr = item.content || '';
    if (contentStr.includes('<video') || (item.attachments && item.attachments.some((a:any) => (a.file_type || a.type) === 'video'))) {
        mediaLabels.push('[동영상]');
    }
    if (item.attachments && item.attachments.some((a:any) => (a.file_type || a.type) === 'file')) {
        mediaLabels.push('[파일]');
    }

    const mediaText = mediaLabels.length > 0 ? mediaLabels.join(' ') : '';
    const plainContent = stripHtml(contentStr);
    const displayContent = plainContent || (images.length > 0 ? (isReply ? '(이미지 댓글)' : '(이미지 게시글)') : '내용 없음');

    const avatar = item.profiles?.avatar_url || item.user?.avatar || '/images/default-avatar.svg';
    const nickname = item.profiles?.nickname || item.user?.name || (item.author_id === user?.profile_id ? user?.nickname : '알 수 없음');

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-2xl border cursor-pointer transition-all hover:border-primary/50 group flex gap-3 ${
                item.deleted_at
                    ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm'
            } relative overflow-hidden`}
        >
            {showLikeBadge && (
                <div className="absolute top-0 right-0 p-1.5 bg-red-50 dark:bg-red-950/30 rounded-bl-xl border-l border-b border-red-100 dark:border-red-900/50">
                    <Heart size={10} className="text-red-500 fill-red-500" />
                </div>
            )}

            <img src={avatar} className="w-8 h-8 rounded-full flex-shrink-0 object-cover bg-zinc-100 border border-zinc-100 dark:border-zinc-800" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{nickname}</span>
                    <span className="text-[9px] text-zinc-400">{format(new Date(item.created_at || item.timestamp), 'MM.dd HH:mm')}</span>
                </div>

                {isReply && item.tweets?.content && (
                    <div className="mb-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded text-[10px] text-zinc-500 border-l-2 border-primary/30 line-clamp-1 italic text-xs">
                        {stripHtml(item.tweets.content)}
                    </div>
                )}

                <p className={`text-sm font-medium line-clamp-2 ${item.deleted_at ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {mediaText && <span className="text-primary mr-1">{mediaText}</span>}
                    {displayContent}
                </p>

                <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1">
                        <MessageCircle size={10} /> {item.reply_count || item.stats?.replies || 0}
                    </div>
                    <div className="flex items-center gap-1">
                        <Heart size={10} /> {item.like_count || item.stats?.likes || 0}
                    </div>
                    {item.deleted_at && <span className="text-red-500 font-bold ml-auto text-[8px]">삭제됨</span>}
                </div>
            </div>
        </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${user?.nickname}님의 활동 내역`}
      className="max-w-4xl h-[85vh] p-0 overflow-hidden"
    >
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
            <button
                onClick={() => setActiveTab('tweets')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'tweets' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
            >
                <div className="flex items-center gap-2">
                    <FileText size={18} /> 게시글
                </div>
                <span className="text-[10px] opacity-70">{counts?.tweets_count || 0}</span>
            </button>
            <button
                onClick={() => setActiveTab('replies')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'replies' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
            >
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} /> 댓글
                </div>
                <span className="text-[10px] opacity-70">{counts?.replies_count || 0}</span>
            </button>
            <button
                onClick={() => setActiveTab('likes')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'likes' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
            >
                <div className="flex items-center gap-2">
                    <Heart size={18} /> 좋아요
                </div>
                <span className="text-[10px] opacity-70">
                    {(counts?.tweet_likes_count || 0) + (counts?.reply_likes_count || 0)}
                </span>
            </button>
            <button
                onClick={() => setActiveTab('chats')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'chats' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
            >
                <div className="flex items-center gap-2">
                    <MessagesSquare size={18} /> 채팅
                </div>
                <span className="text-[10px] opacity-70">{counts?.chats_count || 0}</span>
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {(currentItem || selectedChat) ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Fixed Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10">
                                <button
                                    onClick={() => {
                                        if (selectedChat) setSelectedChat(null);
                                        else setDetailStack(prev => prev.slice(0, -1));
                                    }}
                                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                                >
                                    <ChevronLeft size={16} /> 목록으로
                                </button>
                                <span className="text-xs text-zinc-400 font-medium">상세보기</span>
                            </div>

                            <div className={`flex-1 flex flex-col min-h-0 ${selectedChat ? 'overflow-hidden' : 'overflow-y-auto'} p-6 pt-2 pb-10`}>
                                {activeTab === 'chats' && selectedChat ? (
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
                                            <div
                                                ref={chatBodyRef}
                                                className="overflow-y-auto flex-1 px-4 py-4 space-y-6"
                                                onScroll={handleChatScroll}
                                            >
                                                {chatLoading ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <Loader2 className="animate-spin text-primary" />
                                                    </div>
                                                ) : chatMessages.length === 0 ? (
                                                    <div className="flex items-center justify-center h-full text-zinc-400">
                                                        <p>대화 내용이 없습니다.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {Object.entries(messageGroups).map(([date, messages]) => (
                                                            <div key={date} className="space-y-4">
                                                                <div className="flex justify-center">
                                                                    <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-medium">
                                                                        {formatSmartDate(date)}
                                                                    </span>
                                                                </div>

                                                                 {messages.map((msg) => {
                                                                    if (msg.is_system_message) {
                                                                        return (
                                                                            <div key={msg.id} className="flex justify-center">
                                                                                <span className="text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 rounded-lg">
                                                                                    {msg.content}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <ChatMessageItem
                                                                            key={msg.id}
                                                                            msg={msg}
                                                                            user={user}
                                                                            selectedChat={selectedChat}
                                                                            onOpenMediaViewer={openMediaViewer}
                                                                            onDownload={handleDownload}
                                                                            formatMessageTime={formatMessageTime}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Floating Scroll Button */}
                                            {showScrollDownBtn && (
                                                <button 
                                                    onClick={() => scrollToBottom(true)}
                                                    className="absolute bottom-6 right-6 z-10 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                                                >
                                                    <ArrowDown size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : currentItem ? (
                                    <div className="space-y-6">
                                        {/* Original Context (Parent Tweet) */}
                                        {detailStack.length === 1 && (currentItem?.tweet_id || currentItem?.parent_reply_id) && (
                                            <div className="mb-6 relative">
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">원본 게시글</span>
                                                <div 
                                                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-xl transition-colors"
                                                    onClick={() => handleParentClick(currentItem.tweet_id)}
                                                >
                                                    {currentItem.tweets ? (
                                                        <TweetDetailCard 
                                                            tweet={mapToUIPost(currentItem.tweets)} 
                                                            replyCount={currentItem.tweets.reply_count || 0} 
                                                            isAdminView={true}
                                                        />
                                                    ) : (
                                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center">
                                                            <Loader2 className="animate-spin text-primary w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute left-[19px] top-[60px] bottom-[-20px] w-0.5 bg-zinc-100 dark:bg-zinc-800" />
                                            </div>
                                        )}
                                        
                                        {/* Main Item 상세보기 */}
                                        <div className="relative">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2 block pl-2">
                                                게시글 상세보기
                                            </span>
                                            {currentItem.tweet_id || currentItem.parent_reply_id ? (
                                                <ReplyCard 
                                                    reply={mapToUIReply(currentItem)} 
                                                    highlight={true}
                                                    disableInteractions={true}
                                                    isAdminView={true}
                                                    editingReplyId={null}
                                                    setEditingReplyId={() => {}}
                                                />
                                            ) : (
                                                <TweetDetailCard 
                                                    tweet={mapToUIPost(currentItem)} 
                                                    replyCount={itemReplies.length}
                                                    isAdminView={true}
                                                />
                                            )}
                                        </div>

                                        {/* Replies Area */}
                                        <div className="mt-8 border-t border-zinc-50 dark:border-zinc-900 pt-6">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 pl-2">
                                              { (currentItem.tweet_id || currentItem.parent_reply_id) ? '대댓글' : '댓글'} ({itemReplies.length})
                                            </h4>
                                            
                                            {repliesLoading ? (
                                              <Loader2 className="animate-spin mx-auto py-10 text-primary" />
                                            ) : itemReplies.length === 0 ? (
                                              <p className="text-xs text-zinc-500 py-10 text-center bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                                                데이터가 없습니다.
                                              </p>
                                            ) : (
                                              <div className="space-y-0">
                                                {itemReplies.map(reply => (
                                                  <ReplyCard 
                                                    key={reply.id} 
                                                    reply={reply as UIReply} 
                                                    onClick={() => pushToStack(reply)}
                                                    disableInteractions={true}
                                                    isAdminView={true}
                                                    editingReplyId={null}
                                                    setEditingReplyId={() => {}}
                                                  />
                                                ))}
                                              </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {!currentItem?.deleted_at ? (
                                            <div className="pt-10">
                                                <button 
                                                    onClick={() => handleDeleteContent(currentItem?.id, !currentItem.tweet_id && !currentItem.parent_reply_id)}
                                                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 size={16} /> 이 콘텐츠 삭제하기
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl text-center font-bold text-sm mt-10">
                                                이미 삭제된 콘텐츠입니다. ({format(new Date(currentItem.deleted_at), 'yyyy-MM-dd HH:mm')})
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {data.length === 0 && <p className="text-center text-zinc-500 mt-10">데이터가 없습니다.</p>}
                            {activeTab === 'tweets' && data.map(t => (
                                <ActivityListItem 
                                    key={t.id} 
                                    item={t} 
                                    onClick={() => pushToStack(t)}
                                />
                            ))}
                            {activeTab === 'replies' && data.map(r => (
                                <ActivityListItem 
                                    key={r.id} 
                                    item={r} 
                                    onClick={() => pushToStack(r)}
                                />
                            ))}
                            {activeTab === 'likes' && (
                                <>
                                    {data.map((item, idx) => (
                                        <ActivityListItem 
                                            key={item.id + idx} 
                                            item={item} 
                                            onClick={() => pushToStack(item)}
                                            showLikeBadge={true}
                                        />
                                    ))}
                                    {hasMoreLikes && (
                                        <button 
                                            onClick={() => fetchLikes(likesPage + 1, false)}
                                            className="w-full py-4 text-xs font-bold text-zinc-400 hover:text-primary transition-colors border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl"
                                        >
                                            더 보기
                                        </button>
                                    )}
                                </>
                            )}
                            {activeTab === 'chats' && data.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => { setSelectedChat(c); fetchChatMessages(c.id); }}
                                    className="p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between shadow-sm relative group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            <img src={c.user1?.avatar_url || '/images/default-avatar.svg'} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 object-cover bg-zinc-100" />
                                            <img src={c.user2?.avatar_url || '/images/default-avatar.svg'} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 object-cover bg-zinc-100" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                {c.user1?.nickname || 'Unknown'} & {c.user2?.nickname || 'Unknown'}
                                            </p>
                                            <p className="text-[10px] text-zinc-400">마지막 대화: {c.last_message_at ? format(new Date(c.last_message_at), 'yyyy-MM-dd HH:mm') : '-'}</p>
                                        </div>
                                    </div>
                                    <Eye size={16} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      
      {showLightbox && (
        <ModalImageSlider
          allImages={lightboxImages.map(img => typeof img === 'string' ? img : img.url)}
          modalIndex={lightboxIndex}
          setModalIndex={setLightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}

      {showMediaViewer && (
          <MediaViewer 
            isOpen={showMediaViewer}
            onClose={() => setShowMediaViewer(false)}
            mediaList={mediaList}
            initialMediaId={initialMediaId}
          />
      )}

      <UserProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={activeProfile}
      />
    </Modal>
  );
};

export default AdminUserActivityModal;
