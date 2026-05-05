import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: '회원가입',
    question: '회원가입은 어떻게 하나요?',
    answer: '이메일 계정 또는 Google, Kakao 등 소셜 계정을 통해 간편하게 가입할 수 있습니다. 메인 화면의 "회원가입" 버튼을 클릭하여 안내에 따라 진행해 주세요.'
  },
  {
    category: '구독/결제',
    question: '프리미엄 구독 혜택이 무엇인가요?',
    answer: '프리미엄 멤버십 이용 시 모든 학습 콘텐츠의 광고가 제거되며, 전용 에피소드 접근 권한 및 단어장 무제한 저장 기능을 제공합니다. 상세 혜택은 "구독 및 쿠폰" 탭에서 확인 가능합니다.'
  },
  {
    category: '학습 방법',
    question: '학습 콘텐츠는 어떻게 이용하나요?',
    answer: '원하는 드라마나 영화 장면을 선택하여 시청하면서 실시간 자막, 단어 풀이, 문화 노트를 확인할 수 있습니다. 모르는 단어는 "단어장"에 저장하여 나중에 퀴즈로 복습해 보세요.'
  },
  {
    category: '커뮤니티',
    question: '게시글이 삭제되었어요.',
    answer: '커뮤니티 가이드라인(비속어, 비방, 도배 등)을 위반한 경우 운영팀에 의해 게시글이 숨김 또는 삭제 처리될 수 있습니다. 건전한 커뮤니티 문화를 위해 협조 부탁드립니다.'
  },
  {
    category: '계정 관리',
    question: '비밀번호를 잊어버렸어요.',
    answer: '로그인 화면의 "비밀번호 찾기" 링크를 통해 가입하신 이메일로 재설정 링크를 받으실 수 있습니다. 소셜 가입 계정은 해당 플랫폼에서 비밀번호를 관리하셔야 합니다.'
  },
  {
    category: '학습 방법',
    question: '문화 노트가 무엇인가요?',
    answer: '장면 속에 등장하는 한국의 관용구, 신조어, 또는 특유의 문화를 시청자가 쉽게 이해할 수 있도록 설명해 주는 기능입니다. 학습 화면 우측 상단의 "문화 노트" 아이콘을 클릭해 보세요.'
  },
  {
    category: '기타',
    question: '서비스 이용 중 오류가 발생했습니다.',
    answer: '화면을 새로고침하거나 로그아웃 후 다시 시도해 주세요. 문제가 지속될 경우 "1:1 문의하기"를 통해 상세한 내용(기기 정보, 오류 화면 캡처 등)을 남겨주시면 빠르게 확인해 드리겠습니다.'
  }
];

interface FAQViewProps {
  onClose?: () => void;
  onOpenInquiry?: () => void;
}

export default function FAQView({ onClose, onOpenInquiry }: FAQViewProps) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-secondary">
      <div className="p-6 bg-primary/5 dark:bg-primary/10 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">자주 묻는 질문</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">서비스 이용에 대해 궁금한 점을 확인해 보세요.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {FAQ_DATA.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index}
              className={cn(
                "border rounded-2xl transition-all duration-300",
                isOpen 
                  ? "border-primary bg-primary/[0.02] dark:bg-primary/[0.05] shadow-sm" 
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/20"
              )}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full px-5 py-4 flex items-center justify-between text-left group"
              >
                <div className="flex-1 pr-4">
                  <span className="text-[10px] font-bold text-primary mb-1 block uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h4 className={cn(
                    "text-sm font-bold transition-colors",
                    isOpen ? "text-primary" : "text-gray-800 dark:text-gray-200 group-hover:text-primary"
                  )}>
                    {item.question}
                  </h4>
                </div>
                <ChevronDown 
                  size={18} 
                  className={cn(
                    "text-gray-400 transition-transform duration-300",
                    isOpen ? "rotate-180 text-primary" : "group-hover:text-primary"
                  )} 
                />
              </button>
              <div 
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="px-5 pb-5 pt-0">
                  <div className="h-px bg-gray-100 dark:bg-gray-800 mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <p className="text-xs text-gray-400 text-center">
          원하시는 답변을 찾지 못하셨나요? <br />
          <button 
            onClick={onOpenInquiry}
            className="text-primary font-bold hover:underline"
          >
            1:1 문의하기
          </button>를 이용해 주세요.
        </p>
      </div>
    </div>
  );
}
