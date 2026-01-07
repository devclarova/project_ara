import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/common/Modal';
import { format } from 'date-fns';
import { History, Loader2, AlertCircle, ShieldAlert, ShieldCheck, MessageSquare, AlertTriangle, X } from 'lucide-react';
import ReportActionModal from './ReportActionModal';
import { toast } from 'sonner';

interface SanctionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; profile_id: string; nickname: string } | null;
}

const renderSanctionReason = (reason: any) => {
  if (!reason) return '입력된 사유가 없습니다.';
  const r = String(reason).trim();
  if (!r) return '입력된 사유가 없습니다.';
  
  const mapping: Record<string, string> = {
    'spam': '스팸 및 부적절한 홍보 활동',
    'abuse': '언어폭력 및 비하 발언',
    'harmful': '유해한 콘텐츠 유포',
    'inappropriate': '부적절한 게시물 작성',
    'other': '운영 정책 위반 (기타)',
    'permanent_ban': '영구 이용 정지',
    'ban': '서비스 이용 제한',
    'unban': '이용 제한 해제 처리',
    'offensive': '공격적인 언어 사용',
    'scam': '사기 및 기만 행위',
    'illegal': '불법적 활동 연루',
    'violence': '폭력물 및 위험 요소',
    'harassment': '지속적인 괴롭힘 및 스토킹',
    'privacy': '개인정보 노출 및 침해',
    'impersonation': '타인 및 관리자 사칭',
    'sexual': '성적인 콘텐츠 유포',
    'copyright': '저작권 및 지식재산권 침해',
    'hate_speech': '증오 및 혐오 표현'
  };
  return mapping[r.toLowerCase()] || r;
};

const SanctionHistoryModal: React.FC<SanctionHistoryModalProps> = React.memo(({ isOpen, onClose, user }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_sanction_history_v2', { 
        p_target_user_id: user.id 
      });
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error(err);
      toast.error('이용제한 이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    } else {
      setHistory([]);
      setSelectedReport(null);
    }
  }, [user?.id, isOpen]);

  const handleViewReport = async (reportId: string) => {
    setReportLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(id, nickname, avatar_url, user_id)
        `)
        .eq('id', reportId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('해당 신고 내역을 찾을 수 없습니다.');
        return;
      }
      setSelectedReport(data);
    } catch (err) {
      console.error(err);
      toast.error('신고 정보를 불러오지 못했습니다.');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`${user?.nickname}님의 누적 이용제한 내역`}
        className="max-w-2xl h-[70vh]"
      >
        <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/50 relative">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              <div className="text-center">
                <History size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold">과거 이용제한 기록이 없습니다.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.map((item) => (
                <div 
                  key={item.sanction_id}
                  onClick={() => {
                    if (item.report_id) {
                      handleViewReport(item.report_id);
                    }
                  }}
                  className={`relative p-5 bg-white dark:bg-zinc-800 rounded-2xl border-2 transition-all shadow-sm ${
                    item.report_id 
                      ? 'border-primary/20 hover:border-primary hover:shadow-md hover:shadow-primary/5 active:scale-[0.99] cursor-pointer' 
                      : 'border-zinc-100 dark:border-zinc-800'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${
                    item.sanction_type === 'unban' ? 'bg-green-500' : 
                    item.sanction_type === 'permanent_ban' ? 'bg-red-700' : 'bg-red-400'
                  }`} />

                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div className="flex gap-3 items-center">
                      <div className={`p-2 rounded-lg ${
                        item.sanction_type === 'unban' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {item.sanction_type === 'unban' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                          {item.sanction_type === 'unban' ? '이용 제한 해제' : 
                           item.sanction_type === 'permanent_ban' ? '영구 이용 정지' : `${item.duration_days}일 이용 정지`}
                        </h4>
                        <p className="text-xs font-bold text-zinc-400 mt-0.5">
                          {format(new Date(item.created_at), 'yyyy년 MM월 dd일 HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">담당 관리자</p>
                      <p className="text-sm font-black text-primary">@{item.admin_nickname}</p>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/80 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {item.sanction_type === 'unban' ? '제한 해제 상세 사유' : '이용 제한 상세 사유'}
                        </label>
                        {item.report_id ? (
                          <span className="text-[10px] font-black text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle size={10} /> 신고 연동됨 (클릭 시 신고창 이동)
                          </span>
                        ) : (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${
                            item.sanction_type === 'unban' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                          }`}>
                            {item.sanction_type === 'unban' ? <><ShieldCheck size={10} /> 해제 완료</> : <><X size={10} /> 단독 제재</>}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1">
                          <p className="text-sm font-black leading-relaxed whitespace-pre-wrap break-all text-zinc-900 dark:text-zinc-100">
                              {renderSanctionReason(item.reason)}
                          </p>
                      </div>
                      
                      {item.report_id && (
                        <div className="mt-4">
                          <div className="text-[11px] font-black text-white bg-primary transition-all uppercase tracking-widest flex items-center justify-center gap-2 w-full py-3.5 rounded-xl shadow-lg shadow-primary/20 group-hover:bg-primary/90">
                            <MessageSquare size={14} /> 
                            {reportLoading ? '불러오는 중...' : '해당 신고 상세 내역 바로가기'}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Pop up the report modal as requested */}
      <ReportActionModal 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)} 
        onResolve={fetchHistory}
      />
    </>
  );
});

export default SanctionHistoryModal;
