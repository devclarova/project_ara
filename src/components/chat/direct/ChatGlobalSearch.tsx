import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { Search, MessageCircle, User } from 'lucide-react';
import HighlightText from '@/components/common/HighlightText';
import type { ChatUser, DirectMessage } from '@/types/ChatType';


interface Props {
  onChatSelect: (chatId: string) => void;
  onCreateChat: (userId: string) => void;
}

export default function ChatGlobalSearch({ onChatSelect, onCreateChat }: Props) {
  const { t } = useTranslation();
  const { searchChatHistory, historySearchResults, isHistorySearching } = useDirectChat();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // 디바운스 검색
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchChatHistory(query);
        setHasSearched(true);
      } else {
        setHasSearched(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchChatHistory]);

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-slate-900/50 relative overflow-hidden`}>
      {/* 검색 헤더 */}
      <div className="p-6 md:p-8 flex flex-col items-center z-10">
        {!hasSearched && (
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-nanum">
            {t('chat.title_direct_chat')}
          </h2>
        )}
        
        <div className="relative w-full max-w-md transition-all duration-300 ease-in-out">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
            placeholder={t('chat.search_placeholder_global', '대화 내용, 닉네임 검색')}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 검색 결과 또는 환영 메시지 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-0 relative">
        {hasSearched ? (
          <div className="max-w-3xl mx-auto w-full py-4 space-y-6">
            
            {isHistorySearching ? (
               <div className="text-center py-10 text-gray-400">
                 {t('chat.searching', '검색 중...')}
               </div>
            ) : (historySearchResults.users.length === 0 && historySearchResults.messages.length === 0) ? (
               <div className="text-center py-10 text-gray-400">
                 {t('chat.no_result', '검색 결과가 없습니다.')}
               </div>
            ) : (
                // ... (검색 결과 리스트 코드는 그대로 유지)
                <div className="space-y-6">
                 {/* 사용자 검색 결과 */}
                {historySearchResults.users.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center bg-gray-50/50 dark:bg-slate-800/50">
                      <User className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">사용자 ({historySearchResults.users.length})</span>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                      {historySearchResults.users.map(chat => {
                        const user = chat.other_user;
                        return (
                          <li 
                            key={chat.id} 
                            className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer p-4 flex items-center gap-3"
                            onClick={() => onCreateChat(user.id)}
                          >
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.nickname} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold">
                                {user.nickname.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                <HighlightText text={user.nickname} query={query} />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* 메시지 검색 결과 */}
                {historySearchResults.messages.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center bg-gray-50/50 dark:bg-slate-800/50">
                      <MessageCircle className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">대화 내용 ({historySearchResults.messages.length})</span>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                      {historySearchResults.messages.map(msg => (
                        <li 
                          key={msg.id} 
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer p-4"
                          onClick={() => onChatSelect(msg.chat_id)}
                        >
                          <div className="flex items-start gap-3">
                             {msg.sender?.avatar_url ? (
                                <img src={msg.sender.avatar_url} alt={msg.sender.nickname} className="w-8 h-8 rounded-full object-cover mt-1" />
                             ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-xs text-gray-500 dark:text-gray-300 font-bold mt-1">
                                  {msg.sender?.nickname?.charAt(0) || '?'}
                                </div>
                             )}
                             <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-center mb-1">
                                 <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                   {msg.sender?.nickname || '알 수 없음'}
                                 </span>
                                 <span className="text-xs text-gray-400">
                                   {new Date(msg.created_at).toLocaleDateString()}
                                 </span>
                               </div>
                               <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 break-all">
                                 <HighlightText text={msg.content} query={query} className="bg-primary/20 text-primary px-0.5 rounded-sm" />
                               </p>
                             </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
            )}
          </div>
        ) : (
          // 검색 안 했을 때: 기존 환영 메시지 표시
          <div className={`chat-welcome !bg-transparent !absolute inset-0 flex items-center justify-center`}>
            <div className="welcome-content">
              {/* 타이틀은 위쪽 검색바 쪽으로 이동했으므로 여기선 생략하거나 설명만 표시 */}
              <p className="mb-2 text-lg">{t('chat.select_or_start')}</p>
              <p className="mb-8 text-gray-500">{t('chat.start_conversation')}</p>
              <div className={`feature-info flex gap-4 justify-center`}>
                <p className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-sm text-gray-600 dark:text-gray-300">{t('chat.feature_realtime')}</p>
                <p className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-sm text-gray-600 dark:text-gray-300">{t('chat.feature_search')}</p>
                <p className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-sm text-gray-600 dark:text-gray-300">{t('chat.feature_responsive')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
