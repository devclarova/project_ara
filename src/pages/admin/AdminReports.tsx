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
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');

  // Mock Data
  const [reports, setReports] = useState<Report[]>([
    { id: 'R-001', reporter: 'user123', target: 'bad_user', type: 'user', reason: '부적절한 프로필 사진', created_at: '2025-12-19 10:30', status: 'pending' },
    { id: 'R-002', reporter: 'study_fan', target: 'Aggressive Comment', type: 'comment', reason: '욕설 및 비방', created_at: '2025-12-19 09:15', status: 'pending' },
    { id: 'R-003', reporter: 'newbie', target: 'Spam Post', type: 'post', reason: '스팸/홍보성 게시글', created_at: '2025-12-18 18:20', status: 'resolved' },
    { id: 'R-004', reporter: 'admin_watcher', target: 'Harassment Chat', type: 'chat', reason: '성희롱 발언', created_at: '2025-12-18 14:00', status: 'pending' },
  ]);

  const handleResolve = (id: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    toast.success('신고가 처리되었습니다.');
  };

  const handleDismiss = (id: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'dismissed' } : r));
    toast.info('신고가 반려되었습니다.');
  };

  const filteredReports = reports.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">신고 및 문의 관리</h1>
          <p className="text-slate-500">접수된 사용자 신고를 검토하고 처리합니다.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="검색..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'all' ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              전체
            </button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-orange-50 font-medium text-orange-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              대기중
            </button>
             <button 
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filterStatus === 'resolved' ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              처리완료
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">상태</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">신고 유형</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">신고 사유</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">신고자 / 대상</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">접수 일시</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    {report.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                        <AlertTriangle size={12} /> 대기중
                      </span>
                    )}
                    {report.status === 'resolved' && (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={12} /> 처리완료
                      </span>
                    )}
                    {report.status === 'dismissed' && (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <XOctagon size={12} /> 반려됨
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="capitalize text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {report.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-slate-900 font-medium">{report.reason}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {report.id}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <p className="text-slate-900">From: <span className="font-medium text-slate-700">{report.reporter}</span></p>
                      <p className="text-slate-500">To: <span className="font-medium text-red-500">{report.target}</span></p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-500">{report.created_at}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="상세 보기">
                        <Eye size={18} />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleResolve(report.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-xs font-medium border border-emerald-200"
                          >
                            처리
                          </button>
                           <button 
                             onClick={() => handleDismiss(report.id)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium border border-slate-200"
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
          
          {filteredReports.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500">표시할 신고 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
