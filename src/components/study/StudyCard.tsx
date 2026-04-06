import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StudyCultureNote from './StudyCultureNote';
import StudyVoca from './StudyVoca';
import type { Subtitle } from '../../types/study';
import { useLocation } from 'react-router-dom';

interface StudyCardProps {
  subtitle: Subtitle | null;
  studyId: number;
  noteText?: string;
}

const LAST_STUDY_KEY = 'ara_last_study_path';

const StudyCard: React.FC<StudyCardProps> = ({ subtitle, studyId, noteText }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'words' | 'culture'>('words');

  const location = useLocation();
  const fullPath = location.pathname + location.search;

  // 영속성 레이어 관리 — 마지막 학습 경로를 로컬 스토리지에 기록하여 뒤로가기 또는 복원 시 사용자 경험 유지
  useEffect(() => {
    localStorage.setItem(LAST_STUDY_KEY, fullPath);
  }, [fullPath]);

  return (
    <div>
      {/* 상단 정보 카드 */}
      <div className="p-4 sm:p-5 rounded-xl space-y-1 mb-4 border bg-white/50 shadow-sm dark:bg-secondary">
        <h3 className="text-base sm:text-lg ml-1 sm:ml-2 font-semibold dark:text-gray-100">
          {t('study.study_card_title')}
        </h3>

        {/* 탐색 인터페이스 — 어휘 설명 및 문화 노트 간의 전환을 위한 탭 바 레이아웃 */}
        <div className="p-2 sm:p-3 space-y-3 sm:space-y-4">
          <div className="flex flex-wrap gap-2 sm:space-x-2 mt-1">
            <button
              onClick={() => setActiveTab('words')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base transition ${
                activeTab === 'words'
                  ? 'bg-primary dark:bg-primary/70 text-white'
                  : 'bg-white dark:bg-secondary text-gray-700 border dark:text-gray-300'
              }`}
            >
              {t('study.vocab_explanation')}
            </button>
            <button
              onClick={() => setActiveTab('culture')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base transition ${
                activeTab === 'culture'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-secondary text-gray-700 border dark:text-gray-300'
              }`}
            >
              {t('study.culture_note')}
            </button>
          </div>

          {/* 동적 콘텐츠 렌더링 — 활성화된 탭 상태 및 데이터 가용 여부(noteText)에 따른 하위 컴포넌트 마운트 */}
          <div className="mt-2 sm:mt-3">
            {activeTab === 'words' ? (
              <StudyVoca studyId={studyId} subscribeRealtime sourceStudyPath={fullPath} />
            ) : noteText && noteText.trim() !== '' ? (
              <StudyCultureNote note={noteText} />
            ) : (
              <StudyCultureNote studyId={studyId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCard;
