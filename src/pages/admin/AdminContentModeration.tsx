import React, { useState } from 'react';
import { 
  Trash2, 
  MessageSquare, 
  FileText, 
  MessageCircle, 
  ShieldAlert,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

// Type Definitions
type ContentType = 'post' | 'comment' | 'chat';

const AdminContentModeration = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('post');

  // Helpers
  const handleDelete = (id: string, type: string) => {
    // In real app, call API
    if (confirm('정말로 이 콘텐츠를 삭제하시겠습니까? 복구할 수 없습니다.')) {
      toast.success(`${type} (ID: ${id}) 가 삭제되었습니다.`);
      // Mock UI update: remove item from list (not implemented fully for mock)
    }
  };

  const TabButton = ({ type, label, icon: Icon }: { type: ContentType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
        activeTab === type 
          ? 'border-emerald-500 text-emerald-600' 
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">콘텐츠 중재 (Moderation)</h1>
          <p className="text-slate-500">게시글, 댓글, 채팅 등 서비스 내 콘텐츠를 관리합니다.</p>
        </div>
        <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="콘텐츠 검색..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
        <div className="flex border-b border-slate-100">
          <TabButton type="post" label="게시글 (Posts)" icon={FileText} />
          <TabButton type="comment" label="댓글 (Comments)" icon={MessageSquare} />
          <TabButton type="chat" label="채팅 (Chats)" icon={MessageCircle} />
        </div>

        <div className="p-6">
          {activeTab === 'post' && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">User{i}</span>
                      <span className="text-xs text-slate-400">· 2시간 전</span>
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded">자유게시판</span>
                    </div>
                    <button 
                      onClick={() => handleDelete(`P-${i}`, '게시글')}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">커뮤니티 이용 수칙 위반 의심 게시글 제목 {i}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2">
                    이곳에는 게시글의 내용이 들어갑니다. 관리자는 이 내용을 확인하고 유해한 콘텐츠인지 판단하여 삭제 조치를 취할 수 있습니다. 
                    미리보기 텍스트가 여기에 표시됩니다.
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comment' && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 p-4 border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors bg-white">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="w-8 h-8 bg-slate-200 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-sm text-slate-900">Commenter{i}</span>
                        <span className="text-xs text-slate-400 ml-2">10분 전</span>
                      </div>
                      <button 
                        onClick={() => handleDelete(`C-${i}`, '댓글')}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-slate-700 text-sm mt-1">
                      여기에 댓글 내용이 표시됩니다. 악성 댓글이나 스팸일 경우 삭제할 수 있습니다. #{i}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      원문 게시글: <span className="text-emerald-600 cursor-pointer hover:underline">게시글 제목 {i}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
             <div className="text-center py-12">
               <div className="max-w-md mx-auto bg-amber-50 border border-amber-100 rounded-xl p-6">
                 <ShieldAlert size={48} className="mx-auto text-amber-500 mb-4" />
                 <h3 className="text-lg font-bold text-amber-800 mb-2">프라이버시 경고</h3>
                 <p className="text-amber-700 text-sm mb-4">
                   개인 간의 채팅 내역(Direct Messages)은 개인정보보호 정책에 따라 
                   신고가 접수된 채팅방에 한해서만 열람이 가능합니다.
                 </p>
                 <button className="btn bg-amber-600 text-white hover:bg-amber-700 border-none w-full">
                   신고된 채팅방 내역 조회하기
                 </button>
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminContentModeration;
