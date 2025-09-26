import React, { useState } from 'react';
import StudyCultureNote from './StudyCultureNote';
import StudyVoca from './StudyVoca';
import type { CardDialogue } from '../../types/study';

interface StudyCardProps {
  dialogue: CardDialogue;
  onClose: () => void;
}

const StudyCard: React.FC<StudyCardProps> = ({ dialogue, onClose }) => {
  const [activeTab, setActiveTab] = useState<'words' | 'culture'>('words');

  return (
    <div className="p-4 bg-primary/5 rounded-xl shadow-md space-y-4">
      <h3 className="text-lg font-semibold">학습 카드</h3>
      <p>
        <strong>한국어:</strong> {dialogue.dialogue}
      </p>
      <p>
        <strong>영어:</strong> (자동 번역 자리)
      </p>
      <p>
        <strong>학습 포인트:</strong> {dialogue.category}
      </p>

      {/* 탭 메뉴 */}
      <div className="flex space-x-4 mt-4">
        <button
          onClick={() => setActiveTab('words')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'words' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'
          }`}
        >
          단어 설명
        </button>
        <button
          onClick={() => setActiveTab('culture')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'culture' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'
          }`}
        >
          문화 노트
        </button>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'words' ? (
        <StudyVoca words={dialogue.words} />
      ) : (
        <StudyCultureNote note={dialogue.cultureNote} />
      )}

      {/* <button onClick={onClose} className="mt-3 px-4 py-2 bg-primary text-white rounded-lg">
        닫기
      </button> */}
    </div>
  );
};

export default StudyCard;
