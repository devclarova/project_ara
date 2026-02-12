import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/common/Modal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/utils/dateUtils';
import { 
  MessageSquare, 
  User, 
  AlertTriangle,
  Clock,
  Shield,
  Ban,
  Trash2,
  XOctagon,
  ArrowRight,
  Eye,
  ChevronLeft,
  Link as LinkIcon,
  History
} from 'lucide-react';
import ProfileTabs, { type ProfileTabKey } from '@/pages/profile/components/ProfileTabs';
import ProfileTweets from '@/pages/profile/components/ProfileTweets';
import ProfileHeader from '@/pages/profile/components/ProfileHeader';
import TweetCard from '@/pages/community/feature/TweetCard';
import { ReplyCard } from '@/pages/community/tweet/components/ReplyCard';
import type { FeedItem, UIReply } from '@/types/sns';
import { tweetService } from '@/services/tweetService';
import MediaViewer, { type MediaItem } from '@/components/chat/direct/MediaViewer';
import SanctionDialog from './SanctionDialog';

/** 나이 및 성별 유틸리티 */
const calculateAge = (birthday: string | null) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
};

const translateGender = (gender: string | null) => {
    if (!gender) return null;
    const g = gender.toLowerCase();
    return g === 'male' ? '남성' : g === 'female' ? '여성' : gender;
};

interface Report {
  id: string;
  target_type: 'tweet' | 'reply' | 'user' | 'chat';
  target_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'reviewed';
  reporter?: { nickname: string; avatar_url: string; user_id: string; };
  created_at: string;
  metadata?: { reported_message_ids?: string[]; };
  content_snapshot?: any;
}

interface ReportActionModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: () => void;
}

export default function ReportActionModal({ report, isOpen, onClose, onResolve }: ReportActionModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [targetData, setTargetData] = useState<any>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [activeUserTab, setActiveUserTab] = useState<ProfileTabKey>('posts');
  const [detailStack, setDetailStack] = useState<any[]>([]); // jh-97의 핵심 기능
  const [replies, setReplies] = useState<UIReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportedMessages, setReportedMessages] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [fetchedReporter, setFetchedReporter] = useState<any>(null);

  useEffect(() => {
    if (isOpen && report) fetchTargetData();
    else {
      setTargetData(null); setContextData(null); setDetailStack([]);
      setReportedMessages([]); setReplies([]); setFetchedReporter(null);
    }
  }, [isOpen, report]);

  // detailStack 내 트윗 조회 시 댓글 자동 로드
  useEffect(() => {
    const top = detailStack[detailStack.length - 1];
    if (top && (top.type === 'tweet' || top.type === 'post')) {
      setRepliesLoading(true);
      tweetService.getRepliesByTweetId(top.id, 0, true)
        .then(setReplies).catch(() => toast.error('댓글 로딩 실패'))
        .finally(() => setRepliesLoading(false));
    }
  }, [detailStack]);

  const fetchTargetData = async () => {
    if (!report) return;
    setLoading(true);
    try {
      // 신고자 정보
      if (report.reporter?.user_id) {
        const { data: rProf } = await supabase.from('profiles').select('*').eq('user_id', report.reporter.user_id).maybeSingle();
        if (rProf) {
            const { data: cRow } = await supabase.from('countries').select('name, flag_url').eq('id', rProf.country).maybeSingle();
            setFetchedReporter({ ...rProf, countryName: cRow?.name, countryFlagUrl: cRow?.flag_url });
        }
      }

      // 대상 데이터 (jh-97 채팅 스냅샷 로직 통합)
      if (report.target_type === 'tweet') {
        const { data } = await supabase.from('tweets').select('*, profiles(*)').eq('id', report.target_id).maybeSingle();
        setTargetData(data);
      } else if (report.target_type === 'reply') {
        const { data: reply } = await supabase.from('tweet_replies').select('*, profiles(*)').eq('id', report.target_id).maybeSingle();
        setTargetData(reply);
        if (reply?.tweet_id) {
            const { data: parent } = await supabase.from('tweets').select('*, profiles(*)').eq('id', reply.tweet_id).maybeSingle();
            setContextData(parent);
        }
      } else if (report.target_type === 'user') {
        const { data } = await supabase.from('profiles').select('*').eq('id', report.target_id).maybeSingle();
        setTargetData(data);
      } else if (report.target_type === 'chat') {
        const { data: room } = await supabase.from('direct_chats').select('*').eq('id', report.target_id).maybeSingle();
        if (room) {
          const reporterPId = (await supabase.from('profiles').select('id').eq('user_id', report.reporter?.user_id).maybeSingle()).data?.id;
          const suspectId = room.user1_id === reporterPId ? room.user2_id : room.user1_id;
          const { data: sProf } = await supabase.from('profiles').select('*').eq('id', suspectId).maybeSingle();
          const { data: cRow } = await supabase.from('countries').select('name, flag_url').eq('id', sProf?.country).maybeSingle();
          setTargetData({ ...room, sender: sProf, countryName: cRow?.name, countryFlagUrl: cRow?.flag_url });

          // 채팅 신고 스냅샷 및 컨텍스트
          if (report.content_snapshot) setReportedMessages(report.content_snapshot);
          const { data: msgs } = await supabase.from('direct_messages').select('*, attachments:direct_message_attachments(*)').eq('chat_id', room.id).order('created_at', { ascending: false }).limit(50);
          if (msgs) {
            const sIds = Array.from(new Set(msgs.map(m => m.sender_id)));
            const { data: sProfs } = await supabase.from('profiles').select('*').in('user_id', sIds);
            setContextData(msgs.map(m => ({ ...m, sender: sProfs?.find(p => p.user_id === m.sender_id) })).reverse());
          }
        }
      }
    } catch (e) { toast.error('데이터 로드 실패'); }
    finally { setLoading(false); }
  };

  const handleAction = async (action: 'dismiss' | 'delete' | 'ban') => {
    if (action === 'dismiss') setShowDismissDialog(true);
    else if (action === 'delete') setShowDeleteDialog(true);
    else if (action === 'ban') setShowBanDialog(true);
  };

  const handleViewHistory = async (pId: string, pName: string) => {
    const { data: s } = await supabase.from('sanction_history').select('*').eq('target_user_id', pId).order('created_at', { ascending: false });
    const { data: r } = await supabase.rpc('get_user_related_reports', { target_profile_id: pId });
    const { data: sent } = await supabase.from('reports').select('*').eq('reporter_id', pId).order('created_at', { ascending: false });
    setDetailStack(prev => [...prev, { type: 'user_history', profileId: pId, profileName: pName, sanctions: s || [], reportsReceived: r || [], reportsSent: sent || [] }]);
  };

  const handleViewChatHistory = async (chatId: string) => {
    const { data: msgs } = await supabase.from('direct_messages').select('*, attachments:direct_message_attachments(*)').eq('chat_id', chatId).order('created_at', { ascending: true });
    if (msgs) {
      const sIds = Array.from(new Set(msgs.map(m => m.sender_id)));
      const { data: sProfs } = await supabase.from('profiles').select('*').in('user_id', sIds);
      setDetailStack(prev => [...prev, { type: 'chat_full_history', messages: msgs.map(m => ({ ...m, sender: sProfs?.find(p => p.user_id === m.sender_id) })) }]);
    }
  };

  const renderChatMessage = (msg: any, isReporter: boolean, isHighlighter: boolean = false) => {
    const isDeleted = msg.deleted_at || msg.content === '관리자에 의해 삭제된 메시지입니다.';
    return (
      <div key={msg.id} className="flex flex-col gap-1 w-full mb-4">
        {isHighlighter && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1">신고 대상</span>}
        <div className={`flex gap-2 ${isReporter ? 'justify-end' : 'justify-start'}`}>
          {!isReporter && <Avatar className="w-8 h-8"><AvatarImage src={msg.sender?.avatar_url} /><AvatarFallback>?</AvatarFallback></Avatar>}
          <div className={`max-w-[70%] ${isReporter ? 'items-end' : 'items-start'} flex flex-col`}>
             <span className="text-[10px] text-muted-foreground">{msg.sender?.nickname} • {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
             <div className={`px-3 py-2 rounded-2xl text-sm ${isReporter ? 'bg-primary text-white rounded-tr-sm' : isHighlighter ? 'bg-red-50 border border-red-200 rounded-tl-sm' : 'bg-secondary rounded-tl-sm'}`}>
                {isDeleted ? <span className="line-through opacity-50">{msg.content}</span> : msg.content}
             </div>
             {msg.attachments?.map((a:any) => (
                <div key={a.id} className="mt-1 border rounded-lg overflow-hidden cursor-zoom-in" onClick={() => setSelectedMediaId(a.url)}>
                    <img src={a.url} className="max-w-[200px]" />
                </div>
             ))}
          </div>
          {isReporter && <Avatar className="w-8 h-8"><AvatarImage src={msg.sender?.avatar_url} /><AvatarFallback>?</AvatarFallback></Avatar>}
        </div>
      </div>
    );
  };

  if (!report) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="신고 상세 (jh-97)" className="max-w-4xl h-[85vh] p-0 overflow-hidden" contentClassName="flex flex-col !p-0">
      <SanctionDialog isOpen={showBanDialog} onClose={() => setShowBanDialog(false)} mode="ban" targetUser={(() => {
          const p = targetData?.profiles || targetData?.sender || (report.target_type === 'user' ? targetData : null);
          return p ? { id: p.user_id, profile_id: p.id, nickname: p.nickname } : null;
      })()} onSuccess={() => { onResolve(); onClose(); }} reportId={report.id} />

      <div className="flex h-full bg-background overflow-hidden">
        {/* 사이드바: 메타데이터 & 조치 */}
        <div className="w-[340px] border-r bg-secondary/20 p-6 overflow-y-auto space-y-6">
            <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${report.status==='pending'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>{report.status === 'pending' ? '대기 중' : '처리 완료'}</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{report.target_type}</span>
            </div>
            <div className="bg-background border p-4 rounded-xl">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-1">신고 사유</h4>
                <p className="font-bold text-sm mb-2">{t(`report.reasons.${report.reason}`, report.reason)}</p>
                {report.description && <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">"{report.description}"</p>}
            </div>
            {/* 정보 섹션 */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase">당사자 히스토리</h4>
                <div onClick={() => fetchedReporter && handleViewHistory(fetchedReporter.id, fetchedReporter.nickname)} className="p-3 bg-background border rounded-xl cursor-pointer hover:bg-secondary/50 transition-all flex items-center gap-3">
                    <Avatar className="w-8 h-8"><AvatarImage src={report.reporter?.avatar_url} /><AvatarFallback>R</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="text-xs font-bold truncate">신고자: {report.reporter?.nickname}</p><p className="text-[10px] text-primary underline">기록 보기</p></div>
                </div>
            </div>
            {/* 조치 버튼 */}
            <div className="pt-6 border-t space-y-2">
                <button onClick={() => handleAction('dismiss')} className="w-full p-2.5 rounded-lg border text-sm font-semibold hover:bg-secondary"><Shield size={14} className="inline mr-2" />신고 기각</button>
                <button onClick={() => handleAction('delete')} className="w-full p-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"><Trash2 size={14} className="inline mr-2" />콘텐츠 삭제</button>
                <button onClick={() => handleAction('ban')} className="w-full p-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:opacity-90"><Ban size={14} className="inline mr-2" />사용자 차단</button>
            </div>
        </div>

        {/* 메인: 콘텐츠 프리뷰 & 상세 스택 */}
        <div className="flex-1 bg-gray-50/50 dark:bg-black/20 overflow-hidden relative">
            {detailStack.length > 0 ? (
                <div className="absolute inset-0 z-20 bg-background flex flex-col">
                    <div className="p-3 border-b flex items-center gap-3 bg-secondary/50">
                        <button onClick={() => setDetailStack(prev => prev.slice(0, -1))} className="text-primary flex items-center gap-1 font-bold text-sm"><ChevronLeft size={18} /> 뒤로가기</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {(() => {
                            const top = detailStack[detailStack.length - 1];
                            if (top.type === 'user_history') return (
                                <div className="space-y-8">
                                    <h3 className="text-lg font-bold flex items-center gap-2"><History size={20} /> {top.profileName}님의 상세 내역</h3>
                                    <div className="grid gap-4">
                                        <div className="bg-white dark:bg-zinc-900 border rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-red-500 mb-3 flex items-center gap-2"><Ban size={14} /> 이용 제한 기록 ({top.sanctions.length})</h4>
                                            {top.sanctions.map((s:any) => <div key={s.id} className="text-xs py-2 border-b last:border-0 flex justify-between"><span>{s.reason}</span><span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span></div>)}
                                        </div>
                                        <div className="bg-white dark:bg-zinc-900 border rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-orange-500 mb-3 flex items-center gap-2"><AlertTriangle size={14} /> 받은 신고 ({top.reportsReceived.length})</h4>
                                            {top.reportsReceived.map((r:any) => (
                                                <div key={r.id} className="text-xs py-2 border-b last:border-0 cursor-pointer hover:text-primary" onClick={() => setDetailStack(p=>[...p, {...r, type:'report_detail'}])}>
                                                    <span className="font-bold">[{r.target_type}]</span> {t(`report.reasons.${r.reason}`, r.reason)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                            if (top.type === 'report_detail') return <HistoryReportDetailView report={top} onViewChatHistory={handleViewChatHistory} onItemClick={(item)=>setDetailStack(p=>[...p, item])} />;
                            if (top.type === 'chat_full_history') return <div className="space-y-1">{top.messages.map((m:any) => renderChatMessage(m, false))}</div>;
                            if (top.type === 'tweet') return <div className="max-w-2xl mx-auto"><TweetCard {...top} disableInteractions={true} /></div>;
                            return null;
                        })()}
                    </div>
                </div>
            ) : (
                <div className="h-full overflow-y-auto p-6">
                    {loading ? <div className="h-full flex items-center justify-center font-bold text-muted-foreground">불러오는 중...</div> :
                    !targetData ? <div className="h-full flex items-center justify-center text-muted-foreground"><XOctagon size={40} /></div> :
                    (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <h3 className="text-sm font-bold text-red-500 flex items-center gap-2 mb-4 border-l-4 border-red-500 pl-3">신고 대상 콘텐츠</h3>
                            {report.target_type === 'tweet' && <div className="bg-white dark:bg-zinc-900 border-2 border-red-500 rounded-3xl overflow-hidden shadow-xl"><TweetCard {...targetData} disableInteractions={true} onClick={()=>setDetailStack(p=>[...p, {...targetData, type:'tweet'}])} /></div>}
                            {report.target_type === 'reply' && <div className="bg-white dark:bg-zinc-900 border-2 border-red-500 rounded-3xl overflow-hidden shadow-xl"><ReplyCard reply={targetData} highlight={true} disableInteractions={true} editingReplyId={null} setEditingReplyId={() => {}} /></div>}
                            {report.target_type === 'chat' && (
                                <div className="bg-white dark:bg-zinc-900 border-2 border-red-500 rounded-3xl p-6 shadow-xl space-y-4">
                                    <div className="space-y-1">{reportedMessages.map(m => renderChatMessage(m, false, true))}</div>
                                    <button onClick={() => handleViewChatHistory(targetData.id)} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-md">대화방 전체 흐름 보기</button>
                                </div>
                            )}
                            {/* 사용자 상세 프로필 (jh-97 핵심 디자인) */}
                            <div className="mt-8">
                                <ProfileHeader userProfile={{...targetData, name:targetData?.nickname, username:targetData?.user_id, avatar:targetData?.avatar_url, country:targetData?.countryName}} isOwnProfile={false} hideFollowButton={true} />
                                <ProfileTabs activeTab={activeUserTab} onTabChange={setActiveUserTab} />
                                <ProfileTweets activeTab={activeUserTab} userProfile={targetData} disableInteractions={true} onItemClick={(item)=>setDetailStack(p=>[...p, item])} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      <MediaViewer isOpen={!!selectedMediaId} onClose={() => setSelectedMediaId(null)} mediaList={mediaList} initialMediaId={selectedMediaId || undefined} />
    </Modal>
  );
}

// jh-97의 핵심 보조 컴포넌트: 신고 상세 이력 뷰어
export const HistoryReportDetailView = ({ report, onViewChatHistory, onItemClick }: { report: any, onViewChatHistory: (id: string) => void, onItemClick?: (item: any) => void }) => {
    const { t } = useTranslation();
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            if (report.content_snapshot) { setContent({ ...report.content_snapshot, type: report.target_type }); return; }
            setLoading(true);
            try {
                if (report.target_type === 'tweet') setContent({ ...(await supabase.from('tweets').select('*, user:profiles(*)').eq('id', report.target_id).single()).data, type: 'tweet' });
                else if (report.target_type === 'reply') setContent({ ...(await supabase.from('tweet_replies').select('*, user:profiles(*)').eq('id', report.target_id).single()).data, type: 'reply' });
            } catch(e) {}
            setLoading(false);
        };
        fetch();
    }, [report]);

    return (
        <div className="space-y-6">
            <div className="bg-secondary/30 p-5 rounded-2xl border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 mb-2"><Eye size={12} /> 신고 당시 스냅샷</span>
                {loading ? <div className="text-center py-4 text-xs font-bold text-muted-foreground">불러오는 중...</div> :
                 content ? (
                    <div className="scale-95 origin-top border-2 border-dashed border-primary/30 rounded-2xl overflow-hidden p-2">
                        {content.type === 'tweet' && <TweetCard {...content} user={content.user} disableInteractions={true} onClick={()=>onItemClick?.(content)} />}
                        {content.type === 'reply' && <ReplyCard reply={content} highlight={true} disableInteractions={true} editingReplyId={null} setEditingReplyId={()=>{}} />}
                    </div>
                 ) : <div className="text-center py-8 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-100 italic">원본이 삭제되어 현재 확인할 수 없는 콘텐츠입니다.</div>}
            </div>
            <div className="grid gap-3 p-4 bg-background border rounded-2xl shadow-sm">
                <div className="flex justify-between font-bold text-sm"><span className="text-muted-foreground">신고 사유</span><span className="text-orange-600">{t(`report.reasons.${report.reason}`, report.reason)}</span></div>
                <div className="flex justify-between font-bold text-sm"><span className="text-muted-foreground">신고 시각</span><span>{new Date(report.created_at).toLocaleString()}</span></div>
                {report.description && <div className="text-xs bg-secondary/50 p-3 rounded-xl italic">"{report.description}"</div>}
            </div>
        </div>
    );
};