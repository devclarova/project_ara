import React, { useState } from 'react';
import StudyCultureNote from './StudyCultureNote';
import StudyVoca from './StudyVoca';
import type { Subtitle } from '../../types/study';

interface StudyCardProps {
  subtitle: Subtitle | null;
  studyId: number;
  noteText?: string;
}

const secToMMSS = (sec: number | null | undefined) => {
  if (sec == null || Number.isNaN(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const StudyCard: React.FC<StudyCardProps> = ({ subtitle, studyId, noteText }) => {
  const [activeTab, setActiveTab] = useState<'words' | 'culture'>('words');

  return (
    <div>
      {/* 상단 정보 카드 */}
      <div className="p-4 rounded-xl shadow-md space-y-3 mb-4">
        <h3 className="text-lg font-semibold">학습 카드</h3>

        {/* {subtitle ? (
          <>
            {subtitle.korean_subtitle && (
              <p>
                <strong>한국어:</strong> {subtitle.korean_subtitle}
              </p>
            )}
            {subtitle.pronunciation && (
              <p className="text-sm text-gray-600">
                <strong>발음:</strong> {subtitle.pronunciation}
              </p>
            )}
            {subtitle.english_subtitle && (
              <p>
                <strong>영어:</strong> {subtitle.english_subtitle}
              </p>
            )}
            <p className="text-sm text-gray-500">
              {secToMMSS(subtitle.subtitle_start_time)} → {secToMMSS(subtitle.subtitle_end_time)}
              {subtitle.level ? ` · ${subtitle.level}` : ''}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">선택된 자막이 없습니다.</p>
        )} */}

        {/* 탭 */}
        <div className="p-4 space-y-4">
          <div className="flex space-x-2 mt-2">
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
