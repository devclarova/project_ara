import React, { useState } from 'react';
import Modal from '@/components/common/Modal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import { MessageSquare, Send, CheckCircle, Clock, User } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

const PATH_TO_LABEL: Record<string, string> = {
  '/': '홈/랜딩',
  '/landing': '홈/랜딩',
  '/sns': '커뮤니티',
  '/community': '커뮤니티',
  '/chat': '채팅',
  '/login': '로그인',
  '/signin': '로그인',
  '/register': '회원가입',
  '/signup': '회원가입',
  '/profile': '프로필',
  '/settings': '설정',
  '/subscription': '구독',
  '/goods': '굿즈샵',
  '/studyList': '학습 목록',
  '/study': '학습',
  '/guest-study': '게스트 학습',
  '/voca': '단어장',
  '/admin': '관리자',
  '/hnotifications': '알림',
  '/notifications': '알림',
};

const getPageLabel = (path: string | null) => {
  if (!path) return '-';
  const sortedPaths = Object.keys(PATH_TO_LABEL).sort((a, b) => b.length - a.length);
  if (path === '/') return PATH_TO_LABEL['/'];
  const matchedPath = sortedPaths.find(p => p !== '/' && path.startsWith(p));
  return matchedPath ? PATH_TO_LABEL[matchedPath] : path;
};

export interface Feedback {
  id: string;
  user_id: string | null;
  page_path: string | null;
  area: string | null;
  category: string | null;
  rating: number | null;
  content: string;
  created_at: string;
  status: 'unread' | 'read' | 'replied' | null;
  admin_reply: string | null;
  replied_at: string | null;
  profiles?: {
    id: string;
    nickname: string;
    avatar_url: string | null;
  } | null;
}

interface FeedbackActionModalProps {
  feedback: Feedback | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: () => void;
  tableType?: 'feedback' | 'inquiry';
}

export default function FeedbackActionModal({ 
  feedback, 
  isOpen, 
  onClose, 
  onResolve,
  tableType = 'feedback'
}: FeedbackActionModalProps) {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [localStatus, setLocalStatus] = useState<Feedback['status']>(null);
  const [localAdminReply, setLocalAdminReply] = useState<string | null>(null);
  const [localRepliedAt, setLocalRepliedAt] = useState<string | null>(null);

  // Initialize reply content when modal opens with existing reply
  React.useEffect(() => {
    if (isOpen && feedback) {
      setReplyContent(feedback.admin_reply || '');
      setLocalStatus(feedback.status);
      setLocalAdminReply(feedback.admin_reply);
      setLocalRepliedAt(feedback.replied_at);
      
      // If unread, mark as read automatically when opening
      if (feedback.status === 'unread' || !feedback.status) {
        markAsRead(feedback.id);
      }
    } else {
      setReplyContent('');
      setLocalStatus(null);
      setLocalAdminReply(null);
      setLocalRepliedAt(null);
    }
  }, [isOpen, feedback]);

  const markAsRead = async (id: string) => {
    try {
      const tableName = tableType === 'inquiry' ? 'inquiries' : 'feedback';
      await (supabase as any).from(tableName).update({ status: 'read' }).eq('id', id);
      setLocalStatus('read');
      onResolve(); // Update parent list without closing modal
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleReplySubmit = async () => {
    if (!feedback) return;
    if (!replyContent.trim()) {
      toast.error('답변 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      
      const { error } = await (supabase as any)
        .from(tableType === 'inquiry' ? 'inquiries' : tableType)
        .update({
          status: 'replied',
          admin_reply: replyContent.trim(),
          replied_at: now
        })
        .eq('id', feedback.id);

      if (error) throw error;
      
      setLocalStatus('replied');
      setLocalAdminReply(replyContent.trim());
      setLocalRepliedAt(now);
      
      // Send in-app notification and Email to user
      if (feedback.user_id) {
        try {
          const { data: { user: adminUser } } = await supabase.auth.getUser();
          
          // profiles.id 조회 (user_id로)
          const { data: receiverProfile } = await (supabase as any)
            .from('profiles')
            .select('id')
            .eq('user_id', feedback.user_id)
            .maybeSingle();

          // sender profiles.id 조회
          const { data: senderProfile } = await (supabase as any)
            .from('profiles')
            .select('id')
            .eq('user_id', adminUser?.id)
            .maybeSingle();

          if (receiverProfile?.id) {
            await (supabase as any)
              .from('notifications')
              .insert({
                receiver_id: receiverProfile.id,
                sender_id: senderProfile?.id,
                type: 'system',
                content: `피드백에 관리자 답변이 등록되었습니다: ${replyContent.trim().slice(0, 50)}${replyContent.trim().length > 50 ? '...' : ''}`
              });
          }

          // [EMAIL] Fetch recipient email via RPC
          const { data: userEmail, error: emailFetchError } = await (supabase as any).rpc('get_user_email_admin', {
            p_user_id: feedback.user_id
          });

          if (!emailFetchError && userEmail) {
            // [EMAIL] Call send-email API
            const emailHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>A reply to your feedback – ARA</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f9fb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;line-height:1.6">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 32px;box-shadow:0 4px 16px rgba(0,0,0,.04)">
        <img src="https://lsjozpktmapfqxqyaarw.supabase.co/storage/v1/object/public/avatars/avatars/sample_font_logo.png" alt="ARA Logo" style="display:block;margin:0 auto 20px auto;width:80px;height:auto" />
        <h1 style="font-size:22px;font-weight:700;text-align:center;color:#111827;margin-bottom:8px">We've replied to your feedback</h1>
        <p style="font-size:15px;color:#374151;margin:10px 0">Hi <strong>${feedback.profiles?.nickname || 'there'}</strong>,</p>
        <p style="font-size:15px;color:#374151;margin:10px 0">Thank you for your valuable feedback. Our team has left a reply.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0">
          <p style="font-size:13px;color:#6b7280;margin-bottom:4px">Your feedback</p>
          <p style="font-size:15px;color:#374151;margin:0">${feedback.content}</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:12px 0" />
          <p style="font-size:13px;color:#6b7280;margin-bottom:4px">Our reply</p>
          <p style="font-size:15px;color:#374151;margin:0;font-weight:600">${replyContent.trim()}</p>
        </div>
        <p style="font-size:12px;color:#6b7280;margin:10px 0">If you have any questions, feel free to reply to this email or use the inquiry feature on our service.</p>
      </div>
      <div style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px">© 2026 ARA — Dive into Korean. Made with 🌊</div>
    </div>
  </body>
</html>
`;

            await fetch(`${window.location.origin}/api/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: userEmail,
                subject: '[ARA] A reply to your feedback',
                html: emailHtml
              })
            }).catch(e => console.error('Email API call failed:', e));
          }
        } catch (notifError) {
          console.error('Failed to send notification or email:', notifError);
          // Non-blocking error for notification/email
        }
      }

      toast.success('답변이 등록되었습니다.');
      onResolve();
      // Keep modal open to show the updated status
    } catch (error: unknown) {
      console.error('Reply submission error:', getErrorMessage(error));
      toast.error('답변 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!feedback) return null;

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="피드백 상세 및 답변" 
        className="max-w-3xl"
    >
      <div className="flex flex-col gap-6 p-6">
        {/* Feedback Details */}
        <div className="bg-secondary/30 rounded-xl p-5 border border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border shadow-sm ${
                  localStatus === 'replied' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                  localStatus === 'read' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' :
                  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                }`}>
                  {localStatus === 'replied' ? '답변완료' :
                   localStatus === 'read' ? '읽음' : '안읽음'}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {feedback.category || '기타'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} />
                {new Date(feedback.created_at).toLocaleString()}
              </p>
            </div>
            
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-lg ${i < (feedback.rating || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}>
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">발생 페이지</span>
              <div className="flex">
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate max-w-full" title={feedback.page_path || '-'}>
                  {getPageLabel(feedback.page_path)}
                </span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">발생 영역</span>
              <span className="font-medium truncate block" title={feedback.area || '-'}>
                {feedback.area || '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">작성자</span>
              <div 
                 className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                 onClick={(e) => {
                     e.stopPropagation();
                     if (feedback.profiles) {
                         setShowUserProfileModal(true);
                     }
                 }}
              >
                  <div className="w-5 h-5 rounded-full bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {feedback.profiles?.avatar_url ? (
                          <img src={feedback.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                          <User size={10} className="text-muted-foreground"/>
                      )}
                  </div>
                  <span className="font-medium truncate max-w-[100px] text-sm text-foreground">
                      {feedback.profiles?.nickname || (feedback.user_id ? '회원' : '익명')}
                  </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground block text-xs mb-2">피드백 내용</span>
            <div className="bg-background p-4 rounded-lg border border-border text-sm whitespace-pre-wrap leading-relaxed">
              {feedback.content}
            </div>
          </div>
        </div>

        {/* Reply Section */}
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-primary" /> 관리자 답변
          </h3>
          
          {localStatus === 'replied' ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary">답변 완료</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {localRepliedAt ? new Date(localRepliedAt).toLocaleString() : ''}
                </span>
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                {localAdminReply}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="사용자에게 전달할 답변을 입력하세요..."
                className="w-full min-h-[150px] p-4 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                style={{ outline: 'none' }}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 border border-border"
                >
                  취소
                </button>
                <button 
                  onClick={handleReplySubmit}
                  disabled={isSubmitting || !replyContent.trim()}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Send size={14} />
                  {isSubmitting ? '전송 중...' : '답변 등록 및 알림 발송'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                * 등록 시 알림과 이메일이 자동 발송됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {feedback.profiles && (
        <UserProfileModal 
          isOpen={showUserProfileModal} 
          onClose={() => setShowUserProfileModal(false)} 
          user={{ ...feedback.profiles, user_id: feedback.profiles.id } as any} 
        />
      )}
    </Modal>
  );
}
