import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XOctagon, 
  Eye, 
  MoreVertical,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Report {
  id: string;
  reporter: string;
  target: string;
  type: 'post' | 'comment' | 'chat' | 'user';
  reason: string;
  created_at: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

const AdminReports = () => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');

  const [reports, setReports] = useState<Report[]>([
    { id: 'R-001', reporter: 'user123', target: 'bad_user', type: 'user', reason: '부적절한 프로필 사진', created_at: '2025-12-19 10:30', status: 'pending' },
    { id: 'R-002', reporter: 'study_fan', target: 'Aggressive Comment', type: 'comment', reason: '욕설 및 비방', created_at: '2025-12-19 09:15', status: 'pending' },
    { id: 'R-003', reporter: 'newbie', target: 'Spam Post', type: 'post', reason: '스팸/홍보성 게시글', created_at: '2025-12-18 18:20', status: 'resolved' },
    { id: 'R-004', reporter: 'admin_watcher', target: 'Harassment Chat', type: 'chat', reason: '성희롱 발언', created_at: '2025-12-18 14:00', status: 'pending' },
  ]);

  const handleResolve = (id: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    toast.success(t('admin.report_processed'));
  };

  const handleDismiss = (id: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'dismissed' } : r));
    toast.info(t('admin.report_rejected'));
  };

  const filteredReports = reports.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="w-full p-3 sm:p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">신고 및 문의 관리</h1>
          <p className="text-muted-foreground">접수된 사용자 신고를 검토하고 처리합니다.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="검색..." 
              className="pl-9 pr-4 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-1 focus:ring-primary/30/20 focus:border-ring bg-background text-foreground"
            />
          </div>
          <div className="flex bg-secondary border-2 border-gray-300 dark:border-gray-500 rounded-lg p-1">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'all' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              전체
            </button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-orange-50 dark:bg-orange-900/30 font-medium text-orange-700 dark:text-orange-400' : 'text-muted-foreground  hover:text-foreground'}`}
            >
              대기중
            </button>
             <button 
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'resolved' ? 'bg-primary/10 dark:bg-primary-900/30 font-medium text-primary' : 'text-muted-foreground  hover:text-foreground'}`}
            >
              처리완료
            </button>
          </div>
        </div>
      </div>

      <div className="bg-secondary rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-gray-300 dark:border-gray-600 dark:border-border">
                <th className="py-4 px-6 text-xs font-bold text-muted-foreground  uppercase tracking-wider">상태</th>
                <th className="py-4 px-6 text-xs font-bold text-muted-foreground  uppercase tracking-wider">신고 유형</th>
                <th className="py-4 px-6 text-xs font-bold text-muted-foreground  uppercase tracking-wider">신고 사유</th>
                <th className="py-4 px-6 text-xs font-bold text-muted-foreground  uppercase tracking-wider">신고자 / 대상</th>
                <th className="py-4 px-6 text-xs font-bold text-muted-foreground  uppercase tracking-wider">접수 일시</th>
                <th className="py-4 px-6 text-xs font-bold text-muted-foreground  uppercase tracking-wider text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-muted dark:hover:bg-accent700/50 transition-colors">
                  <td className="py-4 px-6">
                    {report.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                        <AlertTriangle size={12} /> 대기중
                      </span>
                    )}
                    {report.status === 'resolved' && (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-primary-900/30 text-primary border border-primary/30">
                        <CheckCircle size={12} /> 처리완료
                      </span>
                    )}
                    {report.status === 'dismissed' && (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border-2 border-gray-300 dark:border-gray-500 dark:border-border">
                        <XOctagon size={12} /> 반려됨
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="capitalize text-sm font-medium text-foreground bg-muted px-2 py-1 rounded border-2 border-gray-300 dark:border-gray-500 dark:border-border">
                      {report.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-muted-foreground  font-medium">{report.reason}</p>
                    <p className="text-xs text-muted-foreground  mt-0.5">ID: {report.id}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <p className="text-muted-foreground ">From: <span className="font-medium text-foreground">{report.reporter}</span></p>
                      <p className="text-muted-foreground ">To: <span className="font-medium text-red-500 dark:text-red-400">{report.target}</span></p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-muted-foreground ">{report.created_at}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button className="p-2 text-muted-foreground hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="상세 보기">
                        <Eye size={18} />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleResolve(report.id)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors text-xs font-medium border border-primary/30"
                          >
                            처리
                          </button>
                           <button 
                             onClick={() => handleDismiss(report.id)}
                            className="p-2 text-muted-foreground  hover:bg-accent rounded-lg transition-colors text-xs font-medium border-2 border-gray-300 dark:border-gray-500 dark:border-border"
                          >
                            반려
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          
        {filteredReports.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-muted-foreground " />
            </div>
            <p className="text-muted-foreground ">표시할 신고 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
