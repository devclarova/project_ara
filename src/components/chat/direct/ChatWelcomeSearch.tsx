import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirectChat } from '@/contexts/DirectChatContext';
import { Search, User, MessageCircle, ArrowRight, X } from 'lucide-react';
import HighlightText from '@/components/common/HighlightText';
import { BanBadge } from '@/components/common/BanBadge';
// import styles from '../chat.module.css';

interface Props {
  onChatSelect: (chatId: string, messageId?: string) => void;
}

export default function ChatWelcomeSearch({ onChatSelect }: Props) {
  const { t, i18n } = useTranslation();
  const { searchChatHistory, historySearchResults, isHistorySearching } = useDirectChat();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 검색 실행
  useEffect(() => {
    searchChatHistory(debouncedQuery);
  }, [debouncedQuery, searchChatHistory]);

  const hasSearchContent = query.trim().length > 0;

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-secondary">
      {/* 
        검색 바 컨테이너 
        - Default: 화면 중앙 상단 (top-[30%] -> top-[25%]) : 사용자가 '살짝만 더 올리자' 요청
        - Search: 화면 최상단 (top-[40px] -> top-[60px]) : 사용자가 '살짝 더 내리자' 요청
        - 크기(max-w-lg) 및 패딩(py-3) 조정하여 '너무 크다'는 피드백 반영
      */}
      <div
        className={`absolute left-0 right-0 z-30 px-6 transition-all duration-500 ease-in-out flex justify-center
          ${hasSearchContent ? 'top-[60px]' : 'top-[25%] -translate-y-1/2'}`}
      >
        <div
          className={`relative w-full max-w-lg transition-all duration-500 ${!hasSearchContent ? 'scale-105' : 'scale-100'}`}
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className={`h-5 w-5 transition-colors ${hasSearchContent ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <input
            type="text"
            className={`w-full pl-11 pr-10 py-3 rounded-full border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300
              bg-background text-foreground placeholder-muted-foreground
              ${!hasSearchContent ? 'shadow-lg border-border/80' : 'shadow-sm border-border'}`}
            placeholder={t('chat.search_placeholder_history', '채팅방 또는 대화 내용 검색...')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-muted-foreground hover:text-foreground p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {hasSearchContent ? (
        // 검색 결과 뷰
        <div className="flex-1 overflow-y-auto w-full px-4 sm:px-0 pt-[120px] animate-in fade-in duration-500">
          <div className="max-w-3xl mx-auto w-full py-4 space-y-6 pb-20">
            {isHistorySearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p>{t('chat.searching', '검색 중...')}</p>
              </div>
            ) : !historySearchResults?.users?.length && !historySearchResults?.messages?.length ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center">
                <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">
                  {t('chat.no_result', '검색 결과가 없습니다.')}
                </p>
                <p className="text-sm mt-1 opacity-70">
                  {t('chat.no_search_result_desc', {
                    query,
                    defaultValue: `'${query}'에 대한 대화 내역을 찾을 수 없습니다.`,
                  })}
                </p>
              </div>
            ) : (
              <div className="space-y-8 px-2">
                {/* 채팅방(사용자) 검색 결과 */}
                {historySearchResults?.users?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center px-3">
                      <User className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-semibold text-sm text-foreground">
                        {t('chat.search_result_rooms', '채팅방')} (
                        {historySearchResults.users.length})
                      </span>
                    </div>
                    <div className="bg-secondary border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
                      {historySearchResults.users.map(chat => {
                        const otherUser = chat.other_user;
                        if (!otherUser) return null;

                        return (
                          <div
                            key={chat.id}
                            className="hover:bg-primary/5 transition-colors cursor-pointer p-4 flex items-center gap-4 group"
                            onClick={() => onChatSelect(chat.id)}
                          >
                            {otherUser.avatar_url ? (
                              <img
                                src={otherUser.avatar_url}
                                alt={otherUser.nickname}
                                className="w-12 h-12 rounded-full object-cover shadow-sm border border-border"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold text-lg">
                                {otherUser.nickname.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {/* justify-between 제거하여 닉네임 분할 문제 해결 */}
                              <div className="font-semibold text-lg text-foreground flex items-center mb-0.5 gap-1">
                                <HighlightText text={otherUser.nickname} query={query} />
                                <BanBadge bannedUntil={otherUser.banned_until ?? null} size="xs" />
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {t('chat.last_message_label', '마지막 대화')}:{' '}
                                {chat.last_message_at
                                  ? new Intl.DateTimeFormat(i18n.language, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }).format(new Date(chat.last_message_at))
                                  : '-'}
                              </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-all transform group-hover:translate-x-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 메시지 검색 결과 */}
                {historySearchResults?.messages?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center px-3">
                      <MessageCircle className="w-4 h-4 mr-2 text-primary" />
                      <span className="font-semibold text-sm text-foreground">
                        {t('chat.search_result_messages', '대화 내용')} (
                        {historySearchResults.messages.length})
                      </span>
                    </div>
                    <div className="bg-secondary border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
                      {historySearchResults.messages.map(msg => (
                        <div
                          key={msg.id}
                          className="hover:bg-primary/5 transition-colors cursor-pointer p-5 group"
                          onClick={() => onChatSelect(msg.chat_id, msg.id)}
                        >
                          <div className="flex items-start gap-4">
                            {msg.sender?.avatar_url ? (
                              <img
                                src={msg.sender.avatar_url}
                                alt={msg.sender.nickname}
                                className="w-10 h-10 rounded-full object-cover mt-1 border border-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm text-muted-foreground font-bold mt-1">
                                {msg.sender?.nickname?.charAt(0) || '?'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="font-semibold text-sm text-foreground flex items-center gap-1">
                                  {msg.sender?.nickname || '알 수 없음'}
                                  <BanBadge bannedUntil={msg.sender?.banned_until ?? null} size="xs" />
                                </span>
                                <span className="text-xs text-muted-foreground/60 tabular-nums">
                                  {new Intl.DateTimeFormat(i18n.language, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }).format(new Date(msg.created_at))}
                                </span>
                              </div>
                              <div className="text-[15px] leading-relaxed text-muted-foreground/80 line-clamp-2 break-all">
                                <HighlightText
                                  text={msg.content ?? ''}
                                  query={query}
                                  className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 px-0.5 rounded"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // 기본 환영 뷰
        <div className="flex-1 flex flex-col items-center justify-start animte-in fade-in duration-700">
          {/* 
             타이틀 및 설명 컨테이너
             - pt 수치를 줄여서 위로 올림 (pt-[35vh] -> pt-[30vh])
           */}
          <div className="w-full max-w-2xl px-6 text-center space-y-12 pt-[30vh] transition-all duration-500 opacity-100 translate-y-0 transform">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground font-nanum tracking-tight">
                {t('chat.title_direct_chat')}
              </h2>
              <p className="text-lg text-muted-foreground/80 break-keep">
                {t('chat.select_or_start')}
              </p>
            </div>

            {/* 기능 소개 아이콘들 - Lucide 아이콘 제거 (JSON 번역 내의 이모지가 사용됨) */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <div className="px-5 py-2.5 bg-background border border-border rounded-full text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/20 transition-all cursor-default">
                {t('chat.feature_realtime')}
              </div>
              <div className="px-5 py-2.5 bg-background border border-border rounded-full text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/20 transition-all cursor-default">
                {t('chat.feature_search')}
              </div>
              <div className="px-5 py-2.5 bg-background border border-border rounded-full text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/20 transition-all cursor-default">
                {t('chat.feature_responsive')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
