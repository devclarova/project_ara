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
    toast.success('학습 콘텐츠가 성공적으로 업로드되었습니다!');
  };

  // UI Components
  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
        activeTab === id 
          ? 'border-emerald-500 text-emerald-600' 
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">새 학습 영상 업로드</h1>
          <p className="text-slate-500">새로운 학습 콘텐츠를 등록합니다.</p>
        </div>
        <div className="flex gap-3">
           <button 
            type="button"
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            onClick={() => window.history.back()}
          >
            취소
          </button>
          <button 
            type="button" // In a real form this might submit, but we have a dedicated submit button below
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-200 transition-colors"
          >
            <Save size={18} />
            저장하기
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          <TabButton id="basic" label="기본 정보" icon={Type} />
          <TabButton id="source" label="영상 소스" icon={Video} />
          <TabButton id="content" label="학습 내용 (노트/단어)" icon={List} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          
          {/* STEP 1: Basic Info */}
          <div className={activeTab === 'basic' ? 'block space-y-6' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="field">
                  <label className="label font-semibold text-slate-700">제목 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="title"
                    value={basicInfo.title}
                    onChange={handleBasicChange}
                    className="input" 
                    placeholder="예: Friends Season 1 Ep 1" 
                    required 
                  />
                </div>
                <div className="field">
                  <label className="label text-slate-700">짧은 설명</label>
                  <textarea 
                    name="short_description"
                    value={basicInfo.short_description}
                    onChange={handleBasicChange}
                    className="textarea h-24" 
                    placeholder="콘텐츠에 대한 간단한 설명을 입력하세요." 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label className="label text-slate-700">카테고리</label>
                    <input 
                      type="text" 
                      name="categories"
                      value={basicInfo.categories}
                      onChange={handleBasicChange}
                      className="input" 
                      placeholder="예: Drama, Comedy" 
                    />
                  </div>
                  <div className="field">
                    <label className="label text-slate-700">난이도</label>
                    <select 
                      name="level"
                      value={basicInfo.level}
                      onChange={handleBasicChange}
                      className="input"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Normal">Normal</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="field">
                  <label className="label text-slate-700">포스터 이미지 URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="poster_image_url"
                      value={basicInfo.poster_image_url}
                      onChange={handleBasicChange}
                      className="input flex-1" 
                      placeholder="https://..." 
                    />
                    <button type="button" className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <ImageIcon size={20} className="text-slate-500" />
                    </button>
                  </div>
                  {basicInfo.poster_image_url && (
                    <div className="mt-2 aspect-video rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                      <img src={basicInfo.poster_image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {!basicInfo.poster_image_url && (
                     <div className="mt-2 aspect-video rounded-lg bg-slate-50 border border-slate-200 border-dashed flex items-center justify-center text-slate-400">
                       이미지 미리보기
                     </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              <div className="field">
                <label className="label text-slate-700">에피소드 정보</label>
                <input 
                  type="text" 
                  name="episode"
                  value={basicInfo.episode}
                  onChange={handleBasicChange}
                  className="input" 
                  placeholder="예: 01" 
                />
              </div>
              <div className="field">
                <label className="label text-slate-700">씬 (Scene)</label>
                <input 
                  type="text" 
                  name="scene"
                  value={basicInfo.scene}
                  onChange={handleBasicChange}
                  className="input" 
                  placeholder="예: Scene 1" 
                />
              </div>
               <div className="field">
                <label className="label text-slate-700">재생 시간 (초)</label>
                <input 
                  type="number" 
                  name="runtime"
                  value={basicInfo.runtime}
                  onChange={handleBasicChange}
                  className="input" 
                  placeholder="0" 
                />
              </div>
            </div>

            <div className="flex gap-8 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${basicInfo.is_featured ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                  <input type="checkbox" className="hidden" checked={basicInfo.is_featured} onChange={(e) => handleCheckboxChange('is_featured', e.target.checked)} />
                  {basicInfo.is_featured && <CheckCircle2 size={14} />}
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Featured (추천 콘텐츠)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${basicInfo.is_hidden ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                  <input type="checkbox" className="hidden" checked={basicInfo.is_hidden} onChange={(e) => handleCheckboxChange('is_hidden', e.target.checked)} />
                  {basicInfo.is_hidden && <CheckCircle2 size={14} />}
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">숨김 (공개 안 함)</span>
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
          <div className={activeTab === 'source' ? 'block space-y-8' : 'hidden'}>
            
            <div className="flex justify-center mb-8">
              <div className="bg-slate-100 p-1 rounded-xl flex">
                <button
                  type="button"
                  onClick={() => setUploadType('youtube')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    uploadType === 'youtube' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  YouTube 임베드
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('direct')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    uploadType === 'direct' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  직접 영상 업로드
                </button>
              </div>
            </div>

            {uploadType === 'youtube' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-700">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">YouTube 임베드 방식 안내</p>
                    <p>YouTube 영상의 ID 또는 전체 URL을 입력하세요. 저작권 정책을 준수해 주세요.</p>
                  </div>
                </div>

                <div className="field">
                  <label className="label font-semibold text-slate-700">YouTube URL</label>
                  <input 
                    type="text" 
                    value={videoInfo.video_url}
                    onChange={(e) => setVideoInfo(prev => ({...prev, video_url: e.target.value}))}
                    className="input" 
                    placeholder="https://www.youtube.com/watch?v=..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="field">
                    <label className="label text-slate-700">시작 시간 (초)</label>
                    <input 
                      type="number" 
                      value={videoInfo.video_start_time}
                      onChange={(e) => setVideoInfo(prev => ({...prev, video_start_time: Number(e.target.value)}))}
                      className="input" 
                    />
                  </div>
                  <div className="field">
                    <label className="label text-slate-700">종료 시간 (초)</label>
                    <input 
                      type="number" 
                      value={videoInfo.video_end_time}
                      onChange={(e) => setVideoInfo(prev => ({...prev, video_end_time: Number(e.target.value)}))}
                      className="input" 
                    />
                  </div>
                </div>
              </div>
            )}

            {uploadType === 'direct' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3 text-emerald-700">
                  <Upload size={20} className="shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">직접 업로드 방식 안내</p>
                    <p>MP4, WebM 형식의 고화질 비디오 파일을 업로드하세요. 서버 스토리지 용량을 확인하세요.</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                    <Upload size={32} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">비디오 파일 선택</h3>
                  <p className="text-sm text-slate-500 mb-4">또는 여기로 드래그 앤 드롭하세요</p>
                  <input type="file" className="hidden" />
                  <button type="button" className="btn btn-outline btn-sm">파일 찾기</button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="field">
                    <label className="label text-slate-700">시작 시간 (Optional)</label>
                    <input 
                      type="number" 
                      value={videoInfo.video_start_time}
                      onChange={(e) => setVideoInfo(prev => ({...prev, video_start_time: Number(e.target.value)}))}
                      className="input" 
                    />
                  </div>
                  <div className="field">
                    <label className="label text-slate-700">종료 시간 (Optional)</label>
                    <input 
                      type="number" 
                      value={videoInfo.video_end_time}
                      onChange={(e) => setVideoInfo(prev => ({...prev, video_end_time: Number(e.target.value)}))}
                      className="input" 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
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
          <div className={activeTab === 'content' ? 'block space-y-10' : 'hidden'}>
            
            {/* Culture Notes Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm">1</span>
                  문화 노트 (Culture Note)
                </h2>
                <button type="button" onClick={addCultureNote} className="btn btn-sm btn-outline gap-1">
                  <Plus size={16} /> 노트 추가
                </button>
              </div>

              {cultureNotes.map((note, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-200 relative group">
                  <button type="button" onClick={() => removeCultureNote(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="field">
                      <label className="label text-xs">Title ({idx + 1})</label>
                      <input 
                        className="input" 
                        placeholder="예: 한국의 존댓말 문화"
                        value={note.title}
                        onChange={(e) => updateCultureNote(idx, 'title', e.target.value)}
                      />
                    </div>
                     <div className="field">
                      <label className="label text-xs">Subtitle</label>
                      <input 
                        className="input" 
                        placeholder="부제목"
                        value={note.subtitle}
                        onChange={(e) => updateCultureNote(idx, 'subtitle', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="label text-xs block mb-1">Contents (문단)</label>
                    {note.contents.map((content, cIdx) => (
                      <div key={cIdx} className="flex gap-2">
                        <textarea 
                          className="textarea min-h-[80px] text-sm" 
                          placeholder="내용을 입력하세요..."
                          value={content.content_value}
                          onChange={(e) => updateCultureNoteContent(idx, cIdx, e.target.value)}
                        />
                         <button type="button" onClick={() => removeCultureNoteContent(idx, cIdx)} className="text-slate-300 hover:text-red-400 self-start mt-2">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addCultureNoteContent(idx)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mt-2">
                      <Plus size={14} /> 문단 추가
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Vocabulary Section */}
             <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">2</span>
                  주요 단어 (Vocabulary)
                </h2>
                <button type="button" onClick={addWord} className="btn btn-sm btn-outline gap-1">
                  <Plus size={16} /> 단어 추가
                </button>
              </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-slate-200">
                       <th className="py-2 px-2 text-xs font-semibold text-slate-500 w-[15%]">단어</th>
                       <th className="py-2 px-2 text-xs font-semibold text-slate-500 w-[20%]">의미</th>
                       <th className="py-2 px-2 text-xs font-semibold text-slate-500 w-[10%]">품사</th>
                       <th className="py-2 px-2 text-xs font-semibold text-slate-500 w-[15%]">발음</th>
                       <th className="py-2 px-2 text-xs font-semibold text-slate-500 w-[35%]">예문</th>
                       <th className="py-2 px-2 text-xs font-semibold text-slate-500 w-[5%]"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {words.map((word, idx) => (
                       <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                         <td className="p-2">
                           <input 
                             className="input py-1 px-2 text-sm" 
                             value={word.words}
                             onChange={(e) => updateWord(idx, 'words', e.target.value)}
                             placeholder="Word"
                           />
                         </td>
                         <td className="p-2">
                           <input 
                              className="input py-1 px-2 text-sm"
                              value={word.means}
                              onChange={(e) => updateWord(idx, 'means', e.target.value)}
                              placeholder="Meaning"
                           />
                         </td>
                         <td className="p-2">
                           <input 
                              className="input py-1 px-2 text-sm"
                              value={word.parts_of_speech}
                              onChange={(e) => updateWord(idx, 'parts_of_speech', e.target.value)}
                              placeholder="Noun"
                           />
                         </td>
                         <td className="p-2">
                           <input 
                              className="input py-1 px-2 text-sm"
                              value={word.pronunciation}
                              onChange={(e) => updateWord(idx, 'pronunciation', e.target.value)}
                              placeholder="/.../"
                           />
                         </td>
                         <td className="p-2">
                           <input 
                              className="input py-1 px-2 text-sm"
                              value={word.example}
                              onChange={(e) => updateWord(idx, 'example', e.target.value)}
                              placeholder="Example sentence"
                           />
                         </td>
                         <td className="p-2 text-center">
                            <button type="button" onClick={() => removeWord(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

            <div className="flex justify-between pt-8 border-t border-slate-100 mt-8">
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
                모든 변경사항 저장
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminStudyUpload;
