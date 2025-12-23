import React, { useState } from 'react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Save, 
  Video, 
  Type, 
  List, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Types based on user requirements
type DifficultyLevel = 'Easy' | 'Normal' | 'Hard';

interface CultureNoteContent {
  content_value: string;
}

interface CultureNote {
  title: string;
  subtitle: string;
  contents: CultureNoteContent[];
}

interface Word {
  words: string;
  means: string;
  parts_of_speech: string;
  pronunciation: string;
  example: string;
}

const AdminStudyUpload = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'basic' | 'source' | 'content'>('basic');
  const [uploadType, setUploadType] = useState<'youtube' | 'direct'>('youtube');
  
  // Form States
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    short_description: '',
    poster_image_url: '',
    is_featured: false,
    is_hidden: false, // 숨김/표시 기능
    categories: '',
    contents: '', // Generic contents field if needed
    episode: '',
    scene: '',
    level: 'Normal' as DifficultyLevel,
    runtime: 0,
  });

  const [videoInfo, setVideoInfo] = useState({
    video_url: '',
    video_start_time: 0,
    video_end_time: 0,
    video_file_name: '', // For direct upload display
  });

  const [cultureNotes, setCultureNotes] = useState<CultureNote[]>([
    { title: '', subtitle: '', contents: [{ content_value: '' }] }
  ]);

  const [words, setWords] = useState<Word[]>([
    { words: '', means: '', parts_of_speech: '', pronunciation: '', example: '' }
  ]);

  // Handlers
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setBasicInfo(prev => ({ ...prev, [name]: checked }));
  };

  // Culture Note Handlers
  const addCultureNote = () => {
    setCultureNotes([...cultureNotes, { title: '', subtitle: '', contents: [{ content_value: '' }] }]);
  };

  const removeCultureNote = (index: number) => {
    setCultureNotes(cultureNotes.filter((_, i) => i !== index));
  };

  const updateCultureNote = (index: number, field: string, value: string) => {
    const newNotes = [...cultureNotes];
    (newNotes[index] as any)[field] = value;
    setCultureNotes(newNotes);
  };

  const addCultureNoteContent = (noteIndex: number) => {
    const newNotes = [...cultureNotes];
    newNotes[noteIndex].contents.push({ content_value: '' });
    setCultureNotes(newNotes);
  };

  const removeCultureNoteContent = (noteIndex: number, contentIndex: number) => {
    const newNotes = [...cultureNotes];
    newNotes[noteIndex].contents = newNotes[noteIndex].contents.filter((_, i) => i !== contentIndex);
    setCultureNotes(newNotes);
  };

  const updateCultureNoteContent = (noteIndex: number, contentIndex: number, value: string) => {
    const newNotes = [...cultureNotes];
    newNotes[noteIndex].contents[contentIndex].content_value = value;
    setCultureNotes(newNotes);
  };

  // Word Handlers
  const addWord = () => {
    setWords([...words, { words: '', means: '', parts_of_speech: '', pronunciation: '', example: '' }]);
  };

  const removeWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const updateWord = (index: number, field: keyof Word, value: string) => {
    const newWords = [...words];
    newWords[index][field] = value;
    setWords(newWords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      uploadType,
      basicInfo,
      videoInfo,
      cultureNotes,
      words
    });
    toast.success(t('admin.study_uploaded'));
  };

  // UI Components
  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 font-medium transition-all whitespace-nowrap text-[10px] sm:text-xs md:text-sm ${
        activeTab === id 
          ? 'border-b-2 border-primary text-primary bg-primary/5' 
          : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
      }`}
    >
      <Icon size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="w-full max-w-full overflow-hidden box-border p-2 sm:p-4">
      
      {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6 max-w-5xl mx-auto min-w-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground break-words line-clamp-2">새 학습 영상 업로드</h1>
          <p className="text-xs sm:text-sm text-muted-foreground break-words line-clamp-2 mt-0.5 sm:mt-1">새로운 학습 콘텐츠를 등록합니다.</p>
        </div>
      </div>

      <div className="bg-secondary rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden w-full max-w-5xl mx-auto box-border">
        {/* Tabs */}
        <div className="flex border-b border-gray-300 dark:border-gray-600">
          <TabButton id="basic" label="기본 정보" icon={Type} />
          <TabButton id="source" label="영상 소스" icon={Video} />
          <TabButton id="content" label="학습 내용" icon={List} />
        </div>

        <form onSubmit={handleSubmit} className="p-2 sm:p-4 md:p-6 lg:p-8 w-full box-border overflow-hidden">
          
          {/* STEP 1: Basic Info */}
          <div className={activeTab === 'basic' ? 'block space-y-2 sm:space-y-4 md:space-y-6 w-full box-border' : 'hidden'}>
            <div className="w-full box-border">
              <div className="space-y-2 w-full box-border">
                <div className="field w-full box-border min-w-0">
                  <label className="block text-xs font-semibold text-foreground mb-1 truncate">제목 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="title"
                    value={basicInfo.title}
                    onChange={handleBasicChange}
                    className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground" 
                    placeholder="예: Friends Season 1 Ep 1" 
                    required 
                    maxLength={100}
                  />
                </div>
                <div className="field w-full box-border">
                  <label className="block text-xs font-semibold text-foreground mb-1">짧은 설명</label>
                  <textarea 
                    name="short_description"
                    value={basicInfo.short_description}
                    onChange={handleBasicChange}
                    rows={2}
                    className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground resize-none" 
                    placeholder="콘텐츠에 대한 간단한 설명을 입력하세요." 
                  />
                </div>
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 w-full box-border">
                  <div className="field w-full box-border">
                    <label className="block text-xs font-semibold text-foreground mb-1">카테고리</label>
                    <input 
                      type="text" 
                      name="categories"
                      value={basicInfo.categories}
                      onChange={handleBasicChange}
                      className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                      placeholder="예: Drama, Comedy" 
                    />
                  </div>

                  <div className="field w-full box-border">
                    <label className="block text-xs font-semibold text-foreground mb-1">난이도</label>
                    <div className="relative">
                      <select 
                        name="level"
                        value={basicInfo.level}
                        onChange={handleBasicChange}
                        className="w-full box-border px-2 py-2.5 pr-8 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground appearance-none peer"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Normal">Normal</option>
                        <option value="Hard">Hard</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none transition-transform peer-focus:rotate-180">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground">
                          <path fill="currentColor" d="M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="field w-full box-border">
                  <label className="block text-xs font-semibold text-foreground mb-1">포스터 이미지 URL</label>
                  <div className="flex gap-1 w-full box-border">
                    <input 
                      type="text" 
                      name="poster_image_url"
                      value={basicInfo.poster_image_url}
                      onChange={handleBasicChange}
                      className="flex-1 w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                      placeholder="https://..." 
                    />
                    <button type="button" className="flex-shrink-0 p-1.5 border border-gray-300 dark:border-gray-500 rounded hover:bg-muted box-border">
                      <ImageIcon size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                  {basicInfo.poster_image_url && (
                    <div className="mt-2 w-full max-w-xs mx-auto aspect-video rounded-lg bg-muted overflow-hidden border border-gray-300 dark:border-gray-500">
                      <img src={basicInfo.poster_image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {!basicInfo.poster_image_url && (
                    <div className="mt-2 w-full max-w-xs mx-auto aspect-video rounded-lg bg-muted border border-gray-300 dark:border-gray-500 border-dashed flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
                      이미지 미리보기
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 sm:pt-4">
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 w-full box-border">
                <div className="field w-full box-border">
                  <label className="block text-xs font-semibold text-foreground mb-1">에피소드 정보</label>
                  <input 
                    type="text" 
                    name="episode"
                    value={basicInfo.episode}
                    onChange={handleBasicChange}
                    className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                    placeholder="예: 01" 
                  />
                </div>
                <div className="field w-full box-border">
                  <label className="block text-xs font-semibold text-foreground mb-1">씬 (Scene)</label>
                  <input 
                    type="text" 
                    name="scene"
                    value={basicInfo.scene}
                    onChange={handleBasicChange}
                    className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                    placeholder="예: Scene 1" 
                  />
                </div>
                <div className="field w-full box-border">
                  <label className="block text-xs font-semibold text-foreground mb-1">재생 시간 (초)</label>
                  <input 
                    type="number" 
                    name="runtime"
                    value={basicInfo.runtime}
                    onChange={handleBasicChange}
                    className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                    placeholder="0" 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-8 pt-3 sm:pt-4 border-t border-gray-300 dark:border-gray-600">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${basicInfo.is_featured ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-500 bg-secondary'}`}>
                  <input type="checkbox" className="hidden" checked={basicInfo.is_featured} onChange={(e) => handleCheckboxChange('is_featured', e.target.checked)} />
                  {basicInfo.is_featured && <CheckCircle2 size={14} />}
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-foreground">Featured (추천 콘텐츠)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${basicInfo.is_hidden ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-500 bg-secondary'}`}>
                  <input type="checkbox" className="hidden" checked={basicInfo.is_hidden} onChange={(e) => handleCheckboxChange('is_hidden', e.target.checked)} />
                  {basicInfo.is_hidden && <CheckCircle2 size={14} />}
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-foreground">숨김 (공개 안 함)</span>
              </label>
            </div>
            
            <div className="flex justify-end pt-6">
              <button 
                type="button" 
                onClick={() => setActiveTab('source')}
                className="btn btn-primary"
              >
                다음: 영상 소스 설정
              </button>
            </div>
          </div>

          {/* STEP 2: Video Source */}
          <div className={activeTab === 'source' ? 'block space-y-2 sm:space-y-4 w-full box-border' : 'hidden'}>
            
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-muted p-1 rounded-lg flex gap-1">
                <button
                  type="button"
                  onClick={() => setUploadType('youtube')}
                  className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-all ${
                    uploadType === 'youtube' 
                      ? 'bg-secondary text-foreground shadow-sm border border-gray-300 dark:border-gray-500' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('direct')}
                  className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-all ${
                    uploadType === 'direct' 
                      ? 'bg-secondary text-foreground shadow-sm border border-gray-300 dark:border-gray-500' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  직접 업로드
                </button>
              </div>
            </div>

            {uploadType === 'youtube' ? (
              <div className="space-y-2 w-full box-border">
                <div className="p-2 sm:p-3 bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-primary" />
                  <p className="text-[10px] sm:text-xs text-primary">
                    YouTube 영상의 전체 URL을 입력하세요. 저작권 정책을 준수해 주세요.
                  </p>
                </div>

                <div className="field w-full box-border">
                  <label className="block text-xs font-semibold text-foreground mb-1">YouTube URL</label>
                  <input 
                    type="text" 
                    value={videoInfo.video_url}
                    onChange={(e) => setVideoInfo(prev => ({...prev, video_url: e.target.value}))}
                    className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground" 
                    placeholder="https://www.youtube.com/watch?v=..." 
                  />
                </div>

                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 w-full box-border">
                  <div className="field w-full box-border">
                    <label className="block text-xs font-semibold text-foreground mb-1">시작 시간 (초)</label>
                    <input 
                      type="number" 
                      value={videoInfo.video_start_time}
                      onChange={(e) => setVideoInfo(prev => ({...prev, video_start_time: Number(e.target.value)}))}
                      className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                      placeholder="0"
                    />
                  </div>
                  <div className="field w-full box-border">
                    <label className="block text-xs font-semibold text-foreground mb-1">종료 시간 (초)</label>
                    <input 
                      type="number" 
                      value={videoInfo.video_end_time}
                      onChange={(e) => setVideoInfo(prev => ({...prev, video_end_time: Number(e.target.value)}))}
                      className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 w-full box-border">
                <div className="p-2 sm:p-3 bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg flex gap-2">
                  <Upload size={16} className="shrink-0 mt-0.5 text-primary" />
                  <p className="text-[10px] sm:text-xs text-primary">
                    MP4, WebM 형식의 비디오 파일을 업로드하세요. 서버 스토리지 용량을 확인하세요.
                  </p>
                </div>

                <div className="field w-full box-border">
                  <label className="block text-xs font-semibold text-foreground mb-1">영상 파일</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg p-4 sm:p-6 text-center bg-secondary hover:bg-muted transition-colors cursor-pointer">
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="sm:w-7 sm:h-7 text-muted-foreground" />
                        <p className="text-xs sm:text-sm font-medium text-foreground">클릭하여 영상 파일을 선택하세요</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">MP4, WebM, OGG 형식 지원</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 w-full box-border">
                  <div className="field w-full box-border">
                    <label className="block text-xs font-semibold text-foreground mb-1">시작 시간 (초)</label>
                    <input 
                      type="number" 
                      value={videoInfo.video_start_time}
                      onChange={(e) => setVideoInfo(prev => ({...prev, video_start_time: Number(e.target.value)}))}
                      className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                      placeholder="0"
                    />
                  </div>
                  <div className="field w-full box-border">
                    <label className="block text-xs font-semibold text-foreground mb-1">종료 시간 (초)</label>
                    <input 
                      type="number" 
                      value={videoInfo.video_end_time}
                      onChange={(e) => setVideoInfo(prev => ({...prev, video_end_time: Number(e.target.value)}))}
                      className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground" 
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-3 sm:pt-4 border-t border-gray-300 dark:border-gray-600">
              <button 
                type="button" 
                onClick={() => setActiveTab('basic')}
                className="btn btn-outline"
              >
                이전
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('content')}
                className="btn btn-primary"
              >
                다음: 학습 내용 입력
              </button>
            </div>
          </div>

          {/* STEP 3: Content (Culture Note & Words) */}
          <div className={activeTab === 'content' ? 'block space-y-4 sm:space-y-6 w-full box-border' : 'hidden'}>
            
            {/* Culture Notes Section */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-gray-300 dark:border-gray-600">
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm font-semibold">1</span>
                  문화 노트 (Culture Note)
                </h2>
                <button type="button" onClick={addCultureNote} className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-secondary border border-gray-300 dark:border-gray-500 rounded hover:bg-muted transition-colors">
                  <Plus size={14} className="sm:w-4 sm:h-4" /> 노트 추가
                </button>
              </div>

              {cultureNotes.map((note, idx) => (
                <div key={idx} className="bg-secondary rounded-lg p-3 sm:p-4 border border-gray-300 dark:border-gray-500 relative group">
                  <button type="button" onClick={() => removeCultureNote(idx)} className="absolute top-2 sm:top-3 right-2 sm:right-3 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 mb-2">
                    <div className="field w-full box-border">
                      <label className="block text-xs font-semibold text-foreground mb-1">Title ({idx + 1})</label>
                      <input 
                        className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground" 
                        placeholder="예: 한국의 존댓말 문화"
                        value={note.title}
                        onChange={(e) => updateCultureNote(idx, 'title', e.target.value)}
                      />
                    </div>
                     <div className="field w-full box-border">
                      <label className="block text-xs font-semibold text-foreground mb-1">Subtitle</label>
                      <input 
                        className="w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground" 
                        placeholder="부제목"
                        value={note.subtitle}
                        onChange={(e) => updateCultureNote(idx, 'subtitle', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-foreground mb-1">Contents (문단)</label>
                    {note.contents.map((content, cIdx) => (
                      <div key={cIdx} className="flex gap-2">
                        <textarea 
                          className="flex-1 w-full box-border px-2 py-2.5 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground resize-none min-h-[60px]" 
                          placeholder="내용을 입력하세요..."
                          value={content.content_value}
                          onChange={(e) => updateCultureNoteContent(idx, cIdx, e.target.value)}
                        />
                         <button type="button" onClick={() => removeCultureNoteContent(idx, cIdx)} className="text-muted-foreground hover:text-red-500 self-start mt-2 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addCultureNoteContent(idx)} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 mt-1">
                      <Plus size={12} /> 문단 추가
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Vocabulary Section */}
             <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-300 dark:border-gray-600 min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 min-w-0">
                   <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">2</span>
                  <span className="truncate">주요 단어 (Vocabulary)</span>
                </h2>
                <button type="button" onClick={addWord} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-secondary border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-muted transition-colors font-medium flex-shrink-0">
                  <Plus size={16} className="sm:w-4 sm:h-4" /> 단어 추가
                </button>
              </div>

              {/* Mobile Card Layout (< md) */}
              <div className="block md:hidden space-y-3">
                {words.map((word, idx) => (
                  <div key={idx} className="bg-secondary border border-gray-300 dark:border-gray-500 rounded-lg p-3 space-y-2.5 relative">
                    <button 
                      type="button" 
                      onClick={() => removeWord(idx)} 
                      className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-muted"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="pr-8">
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">단어</label>
                      <input 
                        type="text" 
                        value={word.words}
                        onChange={(e) => updateWord(idx, 'words', e.target.value)}
                        className="w-full box-border px-3 py-2.5 text-sm bg-background border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-primary/30 transition-all text-foreground font-medium"
                        placeholder="예: 안녕하세요"
                        maxLength={30}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">의미</label>
                      <input 
                        type="text" 
                        value={word.means}
                        onChange={(e) => updateWord(idx, 'means', e.target.value)}
                        className="w-full box-border px-3 py-2.5 text-sm bg-background border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                        placeholder="Hello"
                        maxLength={50}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">품사</label>
                        <input 
                          type="text" 
                          value={word.parts_of_speech}
                          onChange={(e) => updateWord(idx, 'parts_of_speech', e.target.value)}
                          className="w-full box-border px-3 py-2.5 text-sm bg-background border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                          placeholder="인사"
                          maxLength={20}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">발음</label>
                        <input 
                          type="text" 
                          value={word.pronunciation}
                          onChange={(e) => updateWord(idx, 'pronunciation', e.target.value)}
                          className="w-full box-border px-3 py-2.5 text-sm bg-background border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-primary/30 transition-all text-foreground font-mono text-xs"
                          placeholder="[annyeonghaseyo]"
                          maxLength={50}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">예문</label>
                      <input 
                        type="text" 
                        value={word.example}
                        onChange={(e) => updateWord(idx, 'example', e.target.value)}
                        className="w-full box-border px-3 py-2.5 text-sm bg-background border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                        placeholder="예문을 입력하세요"
                        maxLength={100}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout (>= md) */}
               <div className="hidden md:block overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[700px]">
                   <thead>
                     <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                       <th className="px-3 py-2.5 text-xs font-semibold text-foreground">단어</th>
                       <th className="px-3 py-2.5 text-xs font-semibold text-foreground">의미</th>
                       <th className="px-3 py-2.5 text-xs font-semibold text-foreground">품사</th>
                       <th className="px-3 py-2.5 text-xs font-semibold text-foreground">발음</th>
                       <th className="px-3 py-2.5 text-xs font-semibold text-foreground">예문</th>
                       <th className="px-3 py-2.5 text-xs font-semibold text-foreground w-16"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {words.map((word, idx) => (
                       <tr key={idx} className="border-b border-gray-300 dark:border-gray-600 hover:bg-muted/50 transition-colors">
                         <td className="px-3 py-2.5">
                           <input 
                             type="text" 
                             value={word.words}
                             onChange={(e) => updateWord(idx, 'words', e.target.value)}
                             className="w-full box-border px-2 py-2 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground"
                             placeholder="예: 안녕하세요"
                             maxLength={30}
                           />
                         </td>
                         <td className="px-3 py-2.5">
                           <input 
                             type="text" 
                             value={word.means}
                             onChange={(e) => updateWord(idx, 'means', e.target.value)}
                             className="w-full box-border px-2 py-2 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground"
                             placeholder="Hello"
                             maxLength={50}
                           />
                         </td>
                         <td className="px-3 py-2.5">
                           <input 
                             type="text" 
                             value={word.parts_of_speech}
                             onChange={(e) => updateWord(idx, 'parts_of_speech', e.target.value)}
                             className="w-full box-border px-2 py-2 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground"
                             placeholder="인사"
                             maxLength={20}
                           />
                         </td>
                         <td className="px-3 py-2.5">
                           <input 
                             type="text" 
                             value={word.pronunciation}
                             onChange={(e) => updateWord(idx, 'pronunciation', e.target.value)}
                             className="w-full box-border px-2 py-2 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground"
                             placeholder="[annyeonghaseyo]"
                             maxLength={50}
                           />
                         </td>
                         <td className="px-3 py-2.5">
                           <input 
                             type="text" 
                             value={word.example}
                             onChange={(e) => updateWord(idx, 'example', e.target.value)}
                             className="w-full box-border px-2 py-2 text-xs bg-secondary border border-gray-300 dark:border-gray-500 rounded focus:ring-1 focus:ring-primary/30 transition-all text-foreground"
                             placeholder="예문"
                             maxLength={100}
                           />
                         </td>
                         <td className="px-3 py-2.5 text-center">
                           <button type="button" onClick={() => removeWord(idx)} className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded hover:bg-muted">
                             <Trash2 size={14} />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>

            <div className="flex justify-between pt-3 sm:pt-4 border-t border-gray-300 dark:border-gray-600">
              <button 
                type="button" 
                onClick={() => setActiveTab('source')}
                className="btn btn-outline"
              >
                이전
              </button>
               {/* Final Submit Button */}
               <button 
                onClick={handleSubmit}
                className="btn btn-primary px-8"
              >
                <Save size={18} className="mr-2" />
                등록
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminStudyUpload;
