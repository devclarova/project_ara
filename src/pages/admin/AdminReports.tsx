import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XOctagon, 
  Eye, 
  Search,
  RotateCw,
  Shield,
  User,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import ReportActionModal from './components/ReportActionModal';

interface Report {
  id: string;
  reporter_id: string;
  target_id: string;
  target_type: 'tweet' | 'reply' | 'user' | 'chat';
  reason: string;
  description?: string;
  created_at: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'reviewed';
  content_snapshot?: any;
  reporter?: {
    nickname: string;
    user_id: string;
    avatar_url: string;
  };
  suspect_profile?: {
    nickname: string;
    user_id: string;
    avatar_url: string;
  };
}

const AdminReports = () => {
  const { t, i18n } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select(`
          id,
          reporter_id,
          target_id,
          target_type,
          reason,
          description,
          status,
          created_at,
          metadata,
          content_snapshot,
          reporter:profiles!reporter_id(nickname, user_id, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: reportsData, error } = await query;

      if (error) throw error;

      // Enhance Chat Reports with Suspect Info
      const enhancedReports = await Promise.all(reportsData.map(async (report: any) => {
        if (report.target_type === 'chat') {
            try {
                const { data: room } = await supabase
                    .from('direct_chats')
                    .select('user1_id, user2_id')
                    .eq('id', report.target_id)
                    .maybeSingle();
                
                if (room) {
                    const reporterId = report.reporter_id;
                    const suspectId = room.user1_id === reporterId ? room.user2_id : room.user1_id;

                    if (suspectId) {
                        const { data: suspect } = await supabase
                            .from('profiles')
                            .select('nickname, user_id, avatar_url')
                            .eq('id', suspectId)
                            .maybeSingle();
                        
                        if (suspect) {
                            return { ...report, suspect_profile: suspect };
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching chat suspect', err);
            }
        }
        return report;
      }));

      setReports(enhancedReports as Report[]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenModal = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col p-4 md:p-6 gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap [word-break:keep-all]">
             <Shield className="text-primary" /> 신고 및 문의 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            접수된 신고 내역을 실시간으로 모니터링하고 신속하게 처리하세요.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="relative group flex-1 min-w-[280px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="작성자, 내용 검색..." 
              className="pl-9 pr-4 py-2 w-full bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <div className="flex bg-secondary border border-border rounded-xl p-1 shadow-sm">
            {(['all', 'pending', 'resolved', 'dismissed'] as const).map((status) => (
                <button 
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize
                        ${filterStatus === status 
                            ? 'bg-background text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                >
                {status === 'all' ? '전체' : 
                 status === 'pending' ? '대기' : 
                 status === 'resolved' ? '처리됨' : 
                 status === 'dismissed' ? '기각' : status}
                </button>
            ))}
          </div>

          <button 
             onClick={fetchReports}
             className="p-2 bg-secondary border border-border rounded-xl hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground shadow-sm"
             title="새로고침"
          >
            <RotateCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-secondary rounded-2xl border border-border shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        {loading && reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <RotateCw className="animate-spin" size={32} />
                <p className="text-sm">데이터를 불러오는 중입니다...</p>
            </div>
        ) : (
        <div className="overflow-auto flex-1"> 
          <table className="w-full min-w-[1200px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-sm border-b border-border">
              <tr>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">상태</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">유형</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">신고 사유</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[200px]">피신고자 (대상)</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[200px]">신고자</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[150px]">접수 일시</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-[100px]">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((report: any) => {
                 let targetName = '-';
                 let targetAvatar = null;
                 let targetSub = null;
                 
                 if (report.content_snapshot?.user) {
                     targetName = report.content_snapshot.user.name || report.content_snapshot.user.nickname;
                     targetAvatar = report.content_snapshot.user.avatar || report.content_snapshot.user.avatar_url;
                     targetSub = report.content_snapshot.user.username ? `@${report.content_snapshot.user.username}` : null;
                 } else if (report.target_type === 'user') {
                     targetName = 'User Profile'; 
                 } else if (report.target_type === 'chat') {
                     if (report.suspect_profile) {
                         targetName = report.suspect_profile.nickname;
                         targetAvatar = report.suspect_profile.avatar_url;
                         targetSub = `@${report.suspect_profile.user_id}`;
                     } else {
                         targetName = 'Chat Room';
                     }
                 }

                 return (
                <tr key={report.id} className="hover:bg-background/50 transition-colors group">
                  <td className="py-4 px-6 whitespace-nowrap">
                    {report.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-900/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> 대기
                      </span>
                    )}
                    {report.status === 'resolved' && (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30">
                        <CheckCircle size={10} className="fill-current" /> 처리됨
                      </span>
                    )}
                    {report.status === 'dismissed' && (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                        <XOctagon size={10} /> 기각
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`capitalize text-[11px] font-bold px-2 py-1 rounded-md border shadow-sm
                        ${report.target_type === 'user' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30' : 
                          report.target_type === 'chat' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30' : 
                          'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/10 dark:border-sky-900/30'}
                    `}>
                      {report.target_type === 'tweet' ? '트윗' :
                       report.target_type === 'reply' ? '답글' :
                       report.target_type === 'user' ? '사용자' :
                       report.target_type === 'chat' ? '채팅' : report.target_type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-semibold text-foreground/90 break-keep">{t(`report.reasons.${report.reason}`, { defaultValue: report.reason })}</p>
                    {report.description && report.target_type !== 'chat' && (
                        <p className="text-xs text-muted-foreground/80 truncate max-w-[240px] mt-0.5 break-all" title={report.description}>
                            {report.description}
                        </p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background border border-border overflow-hidden shrink-0">
                             {targetAvatar ? <img src={targetAvatar} alt="" className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-2 text-muted-foreground"/>}
                        </div>
                        <div className="min-w-0">
                             <p className="text-sm font-medium truncate text-foreground">{targetName}</p>
                             {targetSub && <p className="text-xs text-muted-foreground truncate">{targetSub}</p>}
                        </div>
                     </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background border border-border overflow-hidden shrink-0">
                            {report.reporter?.avatar_url ? (
                                <img src={report.reporter.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={16} className="m-auto mt-2 text-muted-foreground"/>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">{report.reporter?.nickname || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground truncate">@{report.reporter?.user_id}</p>
                        </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground/80">
                            {new Date(report.created_at).toLocaleString('ko-KR', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: false 
                            }).replace(/\. /g, '.').replace(/\.$/, '')}
                        </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenModal(report)}
                        className="px-3 py-1.5 text-primary hover:text-white hover:bg-primary rounded-lg transition-all border border-primary/20 hover:border-primary shadow-sm active:scale-95 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        상세 보기 <ArrowRight size={12} />
                      </button>
                  </td>
                </tr>
              );
             })}
              {reports.length === 0 && !loading && (
                <tr>
                    <td colSpan={7} className="py-20 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3 opacity-50">
                            <CheckCircle size={48} strokeWidth={1.5} />
                            <p className="text-lg font-medium">신고 내역이 없습니다</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <ReportActionModal 
        isOpen={isModalOpen} 
        report={selectedReport} 
        onClose={handleModalClose} 
        onResolve={() => {
            fetchReports();
            handleModalClose();
        }} 
      />
    </div>
  );
};

export default AdminReports;
