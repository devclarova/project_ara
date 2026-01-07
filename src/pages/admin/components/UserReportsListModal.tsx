import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/common/Modal';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import ReportActionModal from './ReportActionModal';

interface UserReportsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; profile_id: string; nickname: string } | null;
  mode?: 'sent' | 'received';
}

const UserReportsListModal: React.FC<UserReportsListModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  mode = 'received' 
}) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rpcName = mode === 'sent' ? 'get_user_made_reports' : 'get_user_related_reports';
      const params = { target_profile_id: user.profile_id || user.id };

      const { data, error } = await supabase.rpc(rpcName, params);

      if (error) throw error;
      
      // Enrich reports with participant info if possible
      if (data && data.length > 0) {
        const reporterIds = Array.from(new Set(data.map((r: any) => r.reporter_id).filter(Boolean)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url, user_id')
          .or(`id.in.(${reporterIds.map(id => `"${id}"`).join(',')}),user_id.in.(${reporterIds.map(id => `"${id}"`).join(',')})`);

        const enriched = data.map((r: any) => ({
          ...r,
          reporter: profiles?.find(p => p.id === r.reporter_id || p.user_id === r.reporter_id)
        }));
        setReports(enriched);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('신고 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchReports();
  }, [isOpen, user, mode]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`${user?.nickname}님의 ${mode === 'sent' ? '신고한 내역' : '받은 신고 내역'}`}
      className="max-w-2xl h-[70vh]"
    >
      <div className="flex flex-col h-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <AlertCircle size={48} className="mb-2 opacity-20" />
            <p>신고 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 p-1">
            {reports.map((report) => (
              <div 
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-primary/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      report.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      report.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-zinc-200 text-zinc-600'
                    }`}>
                      {report.status === 'pending' ? '처리 대기' : 
                       report.status === 'resolved' ? '처리 완료' : '반려됨'}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      {format(new Date(report.created_at), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  사유: {
                    report.reason === 'spam' ? '스팸 / 부적절한 홍보' :
                    report.reason === 'abuse' ? '욕설 / 비하 발언' :
                    report.reason === 'harmful' ? '유해한 콘텐츠' :
                    report.reason === 'inappropriate' ? '부적절한 내용' :
                    report.reason === 'other' ? '기타' : report.reason
                  }
                </div>
                {report.description && (
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
                    {report.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-400 font-bold">
                  <span>신고자: <span className="text-zinc-600 dark:text-zinc-300">{report.reporter?.nickname || '시스템'}</span></span>
                  <span className="opacity-30">|</span>
                  <span>신고 대상: <span className="text-zinc-600 dark:text-zinc-300">{
                    report.target_type === 'tweet' ? '게시글' : 
                    report.target_type === 'reply' ? '답글' : 
                    report.target_type === 'user' ? '사용자' : 
                    report.target_type === 'chat' ? '채팅' : report.target_type
                  }</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <ReportActionModal 
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          report={selectedReport}
          onResolve={fetchReports}
        />
      )}
    </Modal>
  );
};

export default UserReportsListModal;
