import React, { useState } from 'react';
import StudyCultureNote from './StudyCultureNote';
import StudyVoca from './StudyVoca';
import type { Subtitle } from '../../types/study';

interface StudyCardProps {
  subtitle: Subtitle | null;
  studyId: number;
  noteText?: string;
}

const StudyCard: React.FC<StudyCardProps> = ({ subtitle, studyId, noteText }) => {
  const [activeTab, setActiveTab] = useState<'words' | 'culture'>('words');

  return (
    <div>
      {/* 상단 정보 카드 */}
      <div className="p-5 rounded-xl space-y-1 mb-4 border bg-white/50 shadow-sm">
        <h3 className="text-lg ml-2 font-semibold">학습 카드</h3>

        {/* 탭 */}
        <div className="p-2 space-y-4">
          <div className="flex space-x-2 mt-1">
            <button
              onClick={() => setActiveTab('words')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'words' ? 'bg-primary text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              단어 설명
            </button>
            <button
              onClick={() => setActiveTab('culture')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'culture' ? 'bg-primary text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              문화 노트
            </button>
          </div>

          {/* 탭 내용 */}
          {activeTab === 'words' ? (
            <StudyVoca studyId={studyId} subscribeRealtime />
          ) : noteText && noteText.trim() !== '' ? (
            <StudyCultureNote note={noteText} />
          ) : (
            <StudyCultureNote studyId={studyId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyCard;
