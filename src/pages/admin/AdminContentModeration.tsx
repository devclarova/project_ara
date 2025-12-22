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

type ContentType = 'post' | 'comment' | 'chat';

const AdminContentModeration = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('post');

  const handleDelete = (id: string, type: string) => {
    if (confirm('정말로 이 콘텐츠를 삭제하시겠습니까? 복구할 수 없습니다.')) {
      toast.success(`${type} (ID: ${id}) 가 삭제되었습니다.`);
    }
  };

  const TabButton = ({ type, label, icon: Icon }: { type: ContentType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
        activeTab === type 
          ? 'border-primary text-primary' 
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="w-full p-3 sm:p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">콘텐츠 중재 (Moderation)</h1>
          <p className="text-muted-foreground">게시글, 댓글, 채팅 등 서비스 내 콘텐츠를 관리합니다.</p>
        </div>
        <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="콘텐츠 검색..." 
              className="pl-9 pr-4 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-1 focus:ring-primary/30/20 dark:focus:ring-1 focus:ring-primary/30/20 focus:border-ring dark:focus:border-ring bg-background text-foreground"
            />
        </div>
      </div>

      <div className="bg-secondary rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm overflow-hidden min-h-[600px]">
        <div className="flex border-b border-gray-300 dark:border-gray-600 overflow-x-auto">
          <TabButton type="post" label="게시글 (Posts)" icon={FileText} />
          <TabButton type="comment" label="댓글 (Comments)" icon={MessageSquare} />
          <TabButton type="chat" label="채팅 (Chats)" icon={MessageCircle} />
        </div>

        <div className="p-3 sm:p-4 md:p-6">
          {activeTab === 'post' && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:border-primary dark:hover:border-primary transition-colors bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">User{i}</span>
                      <span className="text-xs text-muted-foreground">· 2시간 전</span>
                      <span className="bg-muted  text-muted-foreground dark:text-muted-foreground text-xs px-2 py-0.5 rounded">자유게시판</span>
                    </div>
                    <button 
                      onClick={() => handleDelete(`P-${i}`, '게시글')}
                      className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                  <h3 className="font-bold text-foreground mb-1">커뮤니티 이용 수칙 위반 의심 게시글 제목 {i}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
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
                <div key={i} className="flex gap-4 p-4 border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:border-primary dark:hover:border-primary transition-colors bg-secondary">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-sm text-foreground">Commenter{i}</span>
                        <span className="text-xs text-muted-foreground ml-2">10분 전</span>
                      </div>
                      <button 
                        onClick={() => handleDelete(`C-${i}`, '댓글')}
                        className="text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-foreground text-sm mt-1">
                      여기에 댓글 내용이 표시됩니다. 악성 댓글이나 스팸일 경우 삭제할 수 있습니다. #{i}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      원문 게시글: <span className="text-primary cursor-pointer hover:underline">게시글 제목 {i}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
             <div className="text-center py-12">
               <div className="max-w-md mx-auto bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-6">
                 <ShieldAlert size={48} className="mx-auto text-amber-500 dark:text-amber-400 mb-4" />
                 <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2">프라이버시 경고</h3>
                 <p className="text-amber-700 dark:text-amber-400 text-sm mb-4">
                   개인 간의 채팅 내역(Direct Messages)은 개인정보보호 정책에 따라 
                   신고가 접수된 채팅방에 한해서만 열람이 가능합니다.
                 </p>
                 <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white rounded-lg w-full transition-colors">
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
