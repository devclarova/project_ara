import React, { useState, useEffect, useLayoutEffect, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown, Save, Plus, Trash2, X, ChevronUp,
  ArrowLeft, FileText, Video, BookOpen,
  Film, Edit, Loader2, ImageIcon,
  CheckCircle2, AlertCircle, Upload, Eye, EyeOff, Star
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────── */
interface CultureNoteItem {
  id?: number;
  title: string;
  subtitle: string;
  contents: string;
  contentRows: { id?: number; content_value: string }[];
}

interface WordItem {
  id?: number;
  words: string;
  means: string;
  parts_of_speech: string;
  pronunciation: string;
  example: string;
  order_index: number;
}

interface SubtitleItem {
  id?: number;
  english_subtitle: string;
  korean_subtitle: string;
  pronunciation: string;
  subtitle_start_time: number;
  subtitle_end_time: number;
}

/* ─── Shared Styles ───────────────────────── */
const labelCls = "block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider";
const inputCls = "w-full px-3 py-2.5 bg-secondary/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm transition-all focus:bg-background outline-none";

/* ─── Memoized Subtitle Rows ────────────────── */
const MemoSubtitleMobile = memo(({ sub, idx, updateSubtitle, removeSubtitle }: any) => (
  <div className="bg-secondary/20 rounded-lg p-4 border border-gray-100 dark:border-gray-800 relative">
    <button type="button" onClick={() => removeSubtitle(idx)} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 rounded-md"><Trash2 size={14} /></button>
    <div className="space-y-3 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>구간 시작(초)</label>
          <input type="number" step="0.1" value={sub.subtitle_start_time} onChange={(e) => updateSubtitle(idx, 'subtitle_start_time', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>구간 종료(초)</label>
          <input type="number" step="0.1" value={sub.subtitle_end_time} onChange={(e) => updateSubtitle(idx, 'subtitle_end_time', Number(e.target.value))} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>한국어 자막</label>
        <input value={sub.korean_subtitle} onChange={(e) => updateSubtitle(idx, 'korean_subtitle', e.target.value)} className={inputCls} placeholder="안녕하세요" />
      </div>
      <div>
        <label className={labelCls}>영어 자막</label>
        <input value={sub.english_subtitle} onChange={(e) => updateSubtitle(idx, 'english_subtitle', e.target.value)} className={inputCls} placeholder="Hello" />
      </div>
      <div>
        <label className={labelCls}>발음</label>
        <input value={sub.pronunciation} onChange={(e) => updateSubtitle(idx, 'pronunciation', e.target.value)} className={inputCls} placeholder="[an-nyeong]" />
      </div>
    </div>
  </div>
), (prev, next) => prev.sub === next.sub && prev.idx === next.idx);

const MemoSubtitleDesktop = memo(({ sub, idx, updateSubtitle, removeSubtitle }: any) => (
  <tr className="hover:bg-primary/[0.02] group">
    <td className="px-3 py-2"><input type="number" step="0.1" value={sub.subtitle_start_time} onChange={(e) => updateSubtitle(idx, 'subtitle_start_time', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm font-mono text-center bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" /></td>
    <td className="px-3 py-2"><input type="number" step="0.1" value={sub.subtitle_end_time} onChange={(e) => updateSubtitle(idx, 'subtitle_end_time', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm font-mono text-center bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" /></td>
    <td className="px-3 py-2"><input value={sub.korean_subtitle} onChange={(e) => updateSubtitle(idx, 'korean_subtitle', e.target.value)} className="w-full px-2 py-1.5 text-sm font-semibold text-primary bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" placeholder="한국어" /></td>
    <td className="px-3 py-2"><input value={sub.english_subtitle} onChange={(e) => updateSubtitle(idx, 'english_subtitle', e.target.value)} className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" placeholder="English" /></td>
    <td className="px-3 py-2"><input value={sub.pronunciation} onChange={(e) => updateSubtitle(idx, 'pronunciation', e.target.value)} className="w-full px-2 py-1.5 text-xs font-mono text-muted-foreground bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" placeholder="[pronunciation]" /></td>
    <td className="px-3 py-2 text-center"><button type="button" onClick={() => removeSubtitle(idx)} className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button></td>
  </tr>
), (prev, next) => prev.sub === next.sub && prev.idx === next.idx);

/* ─── Component ─────────────────────────────── */
const AdminStudyUpload = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /* ─── Data Persistence (Memory Cache) Init ─────── */
  const CACHE_KEY = '_ara_study_upload_memory_cache';
  const getInitialCache = () => {
    const cached = typeof window !== 'undefined' ? (window as any)[CACHE_KEY] : null;
    // id가 같을 때만 (신규 업로드면 둘 다 undefined이므로 일치) 캐시 적용
    if (cached && cached.id === id) return cached;
    return null;
  };
  const cachedData = getInitialCache();

  // 캐시가 유효하다면 로딩(DB Fetch) 스킵
  const [isLoading, setIsLoading] = useState(isEditMode && !cachedData);

  const [activeTab, setActiveTab] = useState<'basic' | 'source' | 'content'>('basic');
  const [uploadType, setUploadType] = useState<'youtube' | 'direct'>(cachedData?.uploadType || 'youtube');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  /* ── study 테이블 데이터 ── */
  const [studyInfo, setStudyInfo] = useState<any>(cachedData?.studyInfo || {
    title: '',
    poster_image_url: '',
    short_description: '',
    is_featured: false,
    is_hidden: false,
    required_plan: 'free'
  });

  /* ── video 테이블 데이터 ── */
  const [videoInfo, setVideoInfo] = useState<any>(cachedData?.videoInfo || {
    video_url: '',
    categories: '드라마',
    contents: '',
    episode: '',
    scene: '',
    level: '초급',
    runtime: 0,
    video_start_time: 0,
    video_end_time: 0,
    image_url: ''
  });

  /* ── culture_note + culture_note_contents ── */
  const [cultureNotes, setCultureNotes] = useState<CultureNoteItem[]>(cachedData?.cultureNotes || []);

  /* ── words 테이블 ── */
  const [words, setWords] = useState<WordItem[]>(cachedData?.words || []);

  /* ── subtitle 테이블 ── */
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>(cachedData?.subtitles || []);

  /* ─── Data Persistence (Memory Cache) Sync ─────── */
  // useLayoutEffect를 사용하여 DOM 페인팅 직전에 동기식으로 캐시 업데이트
  // 이렇게 하면 SPA 탭 이동/글자 입력 중 탭 이동 시 마지막 글자가 누락되는 현상 완벽 방지
  useLayoutEffect(() => {
    if (isLoading) return; // 로딩 중(빈 폼 상태)에는 캐시를 빈 값으로 덮어씌우지 않도록 방어!
    (window as any)[CACHE_KEY] = {
      id,
      studyInfo,
      videoInfo,
      cultureNotes,
      words,
      subtitles,
      uploadType
    };
  }, [id, studyInfo, videoInfo, cultureNotes, words, subtitles, uploadType, isLoading]);

  /* ─── Data Fetching Logic ─────── */
  useEffect(() => {
    // 1. 라우트 파라미터(id)가 바뀌었을 때 (Mount가 아닌 동일 컴포넌트 내 전환 시 대응)
    const cached = getInitialCache();
    if (cached) {
      // 캐시가 유효하면 복구 (예: /admin/study/upload에서 타이핑하다 왔거나, 123 수정하다 왔거나)
      const cachedStudyInfo = { ...cached.studyInfo };
      if (typeof cachedStudyInfo.poster_image_url === 'string' && cachedStudyInfo.poster_image_url.startsWith('blob:')) {
        cachedStudyInfo.poster_image_url = ''; // 파일 객체 유실된 blob URL 초기화
      }
      setStudyInfo(cachedStudyInfo);
      setVideoInfo(cached.videoInfo);
      setCultureNotes(cached.cultureNotes);
      setWords(cached.words);
      setSubtitles(cached.subtitles || []);
      setUploadType(cached.uploadType);
      
      // 캐시에서 복구 시 로딩 상태 해제가 누락되었던 버그 수정
      setIsLoading(false);
    } else if (id) {
      // 2. 캐시는 없는데 수정 모드(id)면 DB에서 불러옴
      const parsedId = id.includes(':') ? id.split(':')[1] : id;
      fetchStudyData(parsedId);
    } else {
      // 3. 캐시도 없고 id도 없으면 (New 모드 진입) 완전 초기화
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); 

  const resetForm = () => {
    // 메모리 캐시도 함께 비움
    delete (window as any)[CACHE_KEY];
    
    setStudyInfo({
      title: '',
      poster_image_url: '',
      short_description: '',
      is_featured: false,
      is_hidden: false,
      required_plan: 'free'
    });
    setVideoInfo({
      video_url: '',
      categories: '드라마',
      contents: '',
      episode: '',
      scene: '',
      level: '초급',
      runtime: 0,
      video_start_time: 0,
      video_end_time: 0,
      image_url: ''
    });
    setCultureNotes([]);
    setWords([]);
    setSubtitles([]);
    setUploadType('youtube');
    setVideoFile(null);
    setPosterFile(null);
    setIsLoading(false);
    setActiveTab('basic');
  };

  const fetchStudyData = async (studyId: string) => {
    try {
      setIsLoading(true);
      const parsedId = studyId.includes(':') ? studyId.split(':')[1] : studyId;

      // 1. study
      const { data: study, error: studyError } = await supabase
        .from('study').select('*').eq('id', parsedId).single();
      if (studyError) throw studyError;

      setStudyInfo({
        title: study.title || '',
        poster_image_url: study.poster_image_url || '',
        short_description: study.short_description || '',
        is_featured: study.is_featured ?? false,
        is_hidden: study.is_hidden ?? false,
        required_plan: study.required_plan || 'free'
      });

      // 2. video
      const { data: video } = await supabase
        .from('video').select('*').eq('study_id', parsedId).single();
      if (video) {
        // Detect upload type based on URL
        if (video.video_url?.includes('youtube.com') || video.video_url?.includes('youtu.be')) {
          setUploadType('youtube');
        } else if (video.video_url) {
          setUploadType('direct');
        }

        setVideoInfo({
          video_url: video.video_url || '',
          categories: video.categories || '드라마',
          contents: video.contents || '',
          episode: video.episode || '',
          scene: video.scene || '',
          level: video.level || '초급',
          runtime: video.runtime || 0,
          video_start_time: video.video_start_time || 0,
          video_end_time: video.video_end_time || 0,
          image_url: video.image_url || ''
        });
      }

      // 3. culture_note → culture_note_contents
      const { data: notes } = await supabase
        .from('culture_note').select('*').eq('study_id', parsedId).order('id');

      if (notes && notes.length > 0) {
        const noteIds = notes.map(n => n.id);
        const { data: noteContents } = await supabase
          .from('culture_note_contents')
          .select('*')
          .in('culture_note_id', noteIds);

        const mapped: CultureNoteItem[] = notes.map(n => ({
          id: n.id,
          title: n.title || '',
          subtitle: n.subtitle || '',
          contents: n.contents || '',
          contentRows: (noteContents || [])
            .filter(c => c.culture_note_id === n.id)
            .map(c => ({ id: c.id, content_value: c.content_value || '' }))
        }));
        setCultureNotes(mapped);
      }

      // 4. word
      const { data: wordData } = await supabase
        .from('word').select('*').eq('study_id', parsedId).order('id');
      if (wordData) {
        setWords(wordData.map(w => ({
          id: w.id,
          words: w.words || '',
          means: w.means || '',
          parts_of_speech: w.parts_of_speech || '',
          pronunciation: w.pronunciation || '',
          example: w.example || '',
          order_index: 0
        })));
      }

      // 5. subtitle
      const { data: subData } = await supabase
        .from('subtitle').select('*').eq('study_id', parsedId).order('subtitle_start_time');
      if (subData) {
        setSubtitles(subData.map(s => ({
          id: s.id,
          english_subtitle: s.english_subtitle || '',
          korean_subtitle: s.korean_subtitle || '',
          pronunciation: s.pronunciation || '',
          subtitle_start_time: s.subtitle_start_time || 0,
          subtitle_end_time: s.subtitle_end_time || 0
        })));
      }

    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error('데이터를 불러오는 중 오류: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Handlers ────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 엔터키를 눌렀을 때, 텍스트 영역(textarea)이 아닌 경우에만 폼 제출(Submit) 방지
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  const handleStudyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudyInfo((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVideoInfo((prev: any) => ({ ...prev, [name]: name === 'runtime' || name === 'video_start_time' || name === 'video_end_time' ? Number(value) : value }));
  };

  const handleCheckbox = (name: string, checked: boolean) => {
    setStudyInfo((prev: any) => ({ ...prev, [name]: checked }));
  };

  // Culture Notes
  const addCultureNote = () => setCultureNotes(prev => [...prev, { title: '', subtitle: '', contents: '', contentRows: [{ content_value: '' }] }]);
  const removeCultureNote = (i: number) => setCultureNotes(prev => prev.filter((_, idx) => idx !== i));
  const updateCultureNote = (i: number, field: string, value: string) => {
    setCultureNotes(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  };
  const addContentRow = (i: number) => {
    setCultureNotes(prev => { const u = [...prev]; u[i].contentRows.push({ content_value: '' }); return u; });
  };
  const removeContentRow = (noteIdx: number, rowIdx: number) => {
    setCultureNotes(prev => { const u = [...prev]; u[noteIdx].contentRows = u[noteIdx].contentRows.filter((_, j) => j !== rowIdx); return u; });
  };
  const updateContentRow = (noteIdx: number, rowIdx: number, value: string) => {
    setCultureNotes(prev => { const u = [...prev]; u[noteIdx].contentRows[rowIdx] = { ...u[noteIdx].contentRows[rowIdx], content_value: value }; return u; });
  };

  // Words
  const addWord = () => setWords(prev => [...prev, { words: '', means: '', parts_of_speech: '', pronunciation: '', example: '', order_index: prev.length }]);
  const removeWord = (i: number) => setWords(prev => prev.filter((_, idx) => idx !== i));
  const updateWord = (i: number, field: keyof WordItem, value: string) => {
    setWords(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  };

  // Subtitles
  const addSubtitle = useCallback(() => setSubtitles(prev => [...prev, { english_subtitle: '', korean_subtitle: '', pronunciation: '', subtitle_start_time: 0, subtitle_end_time: 0 }]), []);
  const removeSubtitle = useCallback((i: number) => setSubtitles(prev => prev.filter((_, idx) => idx !== i)), []);
  const updateSubtitle = useCallback((i: number, field: keyof SubtitleItem, value: string | number) => {
    setSubtitles(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  }, []);

  /* ─── Submit ──────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyInfo.title) return toast.error('제목을 입력해주세요.');

    try {
      setIsSubmitting(true);
      const parsedId = isEditMode ? (id!.includes(':') ? id!.split(':')[1] : id) : null;
      let studyId = parsedId;

      // 0. 파일 업로드 처리 (직접 업로드인 경우)
      let finalVideoUrl = videoInfo.video_url;
      if (uploadType === 'direct' && videoFile) {
        toast.info('영상을 서버에 업로드 중입니다...', { duration: 2000 });
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `video-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `study-videos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, videoFile, {
            contentType: videoFile.type || 'video/mp4',
            upsert: false
          });

        if (uploadError) throw new Error('영상 업로드 실패: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath);
        finalVideoUrl = urlData.publicUrl;
      }

      // 0.1 썸네일 파일 업로드 처리
      let finalPosterUrl = studyInfo.poster_image_url;
      if (posterFile) {
        toast.info('썸네일 이미지를 업로드 중입니다...', { duration: 2000 });
        const fileExt = posterFile.name.split('.').pop();
        const fileName = `thumb-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `study-thumbnails/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(filePath, posterFile, {
            contentType: posterFile.type || 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw new Error('썸네일 업로드 실패: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(filePath);
        finalPosterUrl = urlData.publicUrl;
      }

      // 1. study 테이블
      const studyData = {
        title: studyInfo.title,
        poster_image_url: finalPosterUrl,
        short_description: studyInfo.short_description,
        is_featured: studyInfo.is_featured,
        is_hidden: studyInfo.is_hidden,
        required_plan: studyInfo.required_plan
        // category 필드가 study 테이블에 없으므로 제외 (video 테이블에서만 관리)
      };

      if (isEditMode) {
        const { error } = await supabase.from('study').update(studyData).eq('id', studyId);
        if (error) throw error;
      } else {
        const { data: newStudy, error } = await supabase.from('study').insert([studyData]).select().single();
        if (error) throw error;
        studyId = newStudy.id;
      }

      // 2. video 테이블
      const videoData = {
        study_id: studyId,
        video_url: finalVideoUrl,
        categories: videoInfo.categories,
        contents: videoInfo.contents,
        episode: videoInfo.episode,
        scene: videoInfo.scene,
        level: videoInfo.level,
        runtime: videoInfo.runtime,
        video_start_time: videoInfo.video_start_time,
        video_end_time: videoInfo.video_end_time,
        image_url: uploadType === 'direct' ? finalPosterUrl : (videoInfo.image_url || finalPosterUrl)
      };

      if (isEditMode) {
        const { error: vErr } = await supabase.from('video').update(videoData).eq('study_id', studyId);
        if (vErr) throw vErr;
      } else {
        const { error: vErr } = await supabase.from('video').insert([videoData]);
        if (vErr) throw vErr;
      }

      // 3. culture_note → culture_note_contents (2단계)
      if (isEditMode) {
        const { data: existingNotes } = await supabase.from('culture_note').select('id').eq('study_id', studyId);
        if (existingNotes && existingNotes.length > 0) {
          const existingIds = existingNotes.map(n => n.id);
          await supabase.from('culture_note_contents').delete().in('culture_note_id', existingIds);
        }
        await supabase.from('culture_note').delete().eq('study_id', studyId);
      }

      for (const note of cultureNotes) {
        // Skip empty notes but process if any field exists
        if (!note.title && !note.subtitle && !note.contents && note.contentRows.every(r => !r.content_value)) continue;

        const { data: inserted, error: noteErr } = await supabase
          .from('culture_note')
          .insert([{ study_id: studyId, title: note.title, subtitle: note.subtitle, contents: note.contents }])
          .select().single();
        if (noteErr) throw noteErr;

        const validRows = note.contentRows.filter(r => r.content_value.trim() !== '');
        if (validRows.length > 0) {
          const rows = validRows.map(r => ({
            culture_note_id: inserted.id,
            content_value: r.content_value
          }));
          const { error: cErr } = await supabase.from('culture_note_contents').insert(rows);
          if (cErr) throw cErr;
        }
      }

      // 4. word 테이블
      if (isEditMode) await supabase.from('word').delete().eq('study_id', studyId);
      const validWords = words.filter(w => w.words.trim() !== '');
      if (validWords.length > 0) {
        const { error: wErr } = await supabase.from('word').insert(
          validWords.map((w) => ({ 
            study_id: studyId, 
            words: w.words, 
            means: w.means, 
            parts_of_speech: w.parts_of_speech, 
            pronunciation: w.pronunciation, 
            example: w.example 
          }))
        );
        if (wErr) throw wErr;
      }

      // 5. subtitle 테이블
      if (isEditMode) await supabase.from('subtitle').delete().eq('study_id', studyId);
      const validSubs = subtitles.filter(s => s.korean_subtitle.trim() !== '' || s.english_subtitle.trim() !== '');
      if (validSubs.length > 0) {
        const { error: subErr } = await supabase.from('subtitle').insert(
          validSubs.map(s => ({
            study_id: studyId,
            english_subtitle: s.english_subtitle,
            korean_subtitle: s.korean_subtitle,
            pronunciation: s.pronunciation,
            subtitle_start_time: s.subtitle_start_time,
            subtitle_end_time: s.subtitle_end_time
          }))
        );
        if (subErr) throw subErr;
      }

      toast.success(isEditMode ? '수정이 완료되었습니다.' : '새 콘텐츠가 등록되었습니다.');
      // 저장 성공 시 메모리 캐시 비움
      delete (window as any)[CACHE_KEY];
      navigate('/admin/study/manage');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('저장 오류: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Shared Styles ───────────────────────── */
  const selectCls = `${inputCls} appearance-none cursor-pointer pr-10`;
  const btnPrimary = "px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50";
  const btnOutline = "px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-gray-200 dark:border-gray-700 hover:bg-muted rounded-lg transition-all";

  /* ─── Loading ─────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
      </div>
    );
  }

  /* ─── Render ──────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/study/manage')} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              {isEditMode ? '콘텐츠 수정' : '신규 콘텐츠 등록'}
            </h1>
            <p className="text-xs text-muted-foreground">{isEditMode ? '기존 학습 콘텐츠를 수정합니다' : '새 학습 콘텐츠를 등록합니다'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/admin/study/manage')} className={btnOutline}>취소</button>
          <button type="submit" disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {isEditMode ? '저장' : '등록'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-secondary/30 p-1 rounded-xl border border-gray-200 dark:border-gray-700 flex gap-1">
        {([['basic', '기본 정보', BookOpen], ['source', '영상 소스', Video], ['content', '학습 내용', FileText]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === key ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB 1: 기본 정보 ═══════════ */}
      <div className={activeTab === 'basic' ? 'space-y-5' : 'hidden'}>
        <div className="bg-background rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <BookOpen size={16} className="text-primary" /> 기본 정보
          </h3>

          {/* 제목 */}
          <div>
            <label className={labelCls}>콘텐츠 제목</label>
            <input name="title" value={studyInfo.title} onChange={handleStudyChange} className={inputCls} placeholder="학습 제목을 입력하세요" required />
          </div>

          {/* 카테고리 + 난이도 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>카테고리</label>
              <div className="relative">
                <select name="categories" value={videoInfo.categories} onChange={handleVideoChange} className={selectCls}>
                <option value="드라마">드라마</option>
                <option value="영화">영화</option>
                <option value="예능">예능</option>
                <option value="음악">음악</option>
              </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
              </div>
            </div>
            <div>
              <label className={labelCls}>난이도</label>
              <div className="relative">
                <select name="level" value={videoInfo.level} onChange={handleVideoChange} className={selectCls}>
                <option value="초급">초급</option>
                <option value="중급">중급</option>
                <option value="고급">고급</option>
              </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
              </div>
            </div>
          </div>

          {/* 권한 레벨 (Premium / Basic / Free) */}
          <div>
            <label className={labelCls}>요구 멤버십 등급</label>
            <div className="relative">
              <select name="required_plan" value={studyInfo.required_plan} onChange={handleStudyChange} className={selectCls}>
                <option value="free">Free (전체 공개)</option>
                <option value="basic">Basic (베이직 이상)</option>
                <option value="premium">🌟 Premium (VIP 전용)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
            </div>
          </div>

          {/* 에피소드 + 씬 + 재생시간 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>에피소드 번호</label>
              <input name="episode" value={videoInfo.episode} onChange={handleVideoChange} className={inputCls} placeholder="EP.01" />
            </div>
            <div>
              <label className={labelCls}>씬 (Scene)</label>
              <input name="scene" value={videoInfo.scene} onChange={handleVideoChange} className={inputCls} placeholder="Scene 1" />
            </div>
            <div>
              <label className={labelCls}>총 재생 시간 (초)</label>
              <input type="number" name="runtime" value={videoInfo.runtime} onChange={handleVideoChange} className={inputCls} placeholder="0" />
            </div>
          </div>

          {/* 콘텐츠명 */}
          <div>
            <label className={labelCls}>콘텐츠 그룹 (드라마/영화 등 전체 이름)</label>
            <input name="contents" value={videoInfo.contents} onChange={handleVideoChange} className={inputCls} placeholder="예: 오징어 게임" />
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* 추가 설정 (숨김 / 추천) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-background/50">
              <div>
                <p className="text-sm font-semibold text-foreground">숨김 처리</p>
                <p className="text-xs text-muted-foreground mt-0.5">사용자에게 콘텐츠를 노출하지 않습니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_hidden" checked={studyInfo.is_hidden} onChange={(e) => setStudyInfo((prev: any) => ({ ...prev, is_hidden: e.target.checked }))} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00BFA5]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00BFA5]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-background/50">
              <div>
                <p className="text-sm font-semibold text-foreground">추천 등록</p>
                <p className="text-xs text-muted-foreground mt-0.5">메인 상단 추천 영역에 표시합니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_featured" checked={studyInfo.is_featured} onChange={(e) => setStudyInfo((prev: any) => ({ ...prev, is_featured: e.target.checked }))} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00BFA5]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00BFA5]"></div>
              </label>
            </div>
          </div>

          {/* 썸네일 - 라벨 위, 입력 중간, 프리뷰 아래 */}
          <div>
            <label className={labelCls}>썸네일 이미지 URL</label>
            <div className="relative group/input">
              <input 
                name="poster_image_url" 
                value={studyInfo.poster_image_url} 
                onChange={handleStudyChange} 
                className={`${inputCls} pr-10`} 
                placeholder="https://..." 
              />
              <label 
                htmlFor="poster-upload" 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                title="이미지 파일 업로드"
              >
                <Upload size={14} />
                <input 
                  type="file" 
                  id="poster-upload" 
                  className="sr-only" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPosterFile(file);
                      setStudyInfo((prev: any) => ({ ...prev, poster_image_url: URL.createObjectURL(file) }));
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {studyInfo.poster_image_url && (
              <div className="mt-2 w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-muted relative group">
                <img
                  src={studyInfo.poster_image_url}
                  alt="미리보기"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {posterFile && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded text-[9px] text-white font-bold tracking-tighter uppercase">
                    New File
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 상세 설명 */}
          <div>
            <label className={labelCls}>학습 상세 설명</label>
            <textarea
              name="short_description"
              value={studyInfo.short_description}
              onChange={handleStudyChange}
              className={`${inputCls} resize-none min-h-[100px]`}
              placeholder="이 학습의 목표와 내용을 간단히 적어주세요."
            />
          </div>

          {/* 체크박스 */}
          <div className="flex flex-wrap gap-6 pt-3 border-t border-gray-100 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all text-xs ${studyInfo.is_featured ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                <input type="checkbox" className="hidden" checked={studyInfo.is_featured} onChange={(e) => handleCheckbox('is_featured', e.target.checked)} />
                {studyInfo.is_featured && <Star size={12} />}
              </div>
              <span className={`text-sm ${studyInfo.is_featured ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>추천 콘텐츠</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all text-xs ${studyInfo.is_hidden ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                <input type="checkbox" className="hidden" checked={studyInfo.is_hidden} onChange={(e) => handleCheckbox('is_hidden', e.target.checked)} />
                {studyInfo.is_hidden && <EyeOff size={12} />}
              </div>
              <span className={`text-sm ${studyInfo.is_hidden ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>숨김 처리</span>
            </label>
          </div>
        </div>

        {/* 다음 버튼 */}
        <div className="flex justify-end">
          <button type="button" onClick={() => setActiveTab('source')} className={btnPrimary}>
            다음: 영상 소스 <ChevronDown size={14} className="-rotate-90" />
          </button>
        </div>
      </div>

      {/* ═══════════ TAB 2: 영상 소스 ═══════════ */}
      <div className={activeTab === 'source' ? 'space-y-5' : 'hidden'}>
        <div className="bg-background rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <Video size={16} className="text-primary" /> 영상 소스 설정
          </h3>

          {/* 업로드 타입 선택 */}
          <div className="flex gap-2 p-1 bg-secondary/30 rounded-lg border border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setUploadType('youtube')} className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${uploadType === 'youtube' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}>
              YouTube 링크
            </button>
            <button type="button" onClick={() => setUploadType('direct')} className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${uploadType === 'direct' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}>
              직접 업로드
            </button>
          </div>

          {uploadType === 'youtube' ? (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2">
                <AlertCircle size={16} className="shrink-0 text-primary mt-0.5" />
                <p className="text-xs text-primary leading-relaxed">
                  학습에 사용할 YouTube 영상 주소를 입력하세요. 영상의 특정 구간만 학습으로 사용하고 싶다면 아래 시작/종료 시간을 설정하세요.
                </p>
              </div>
              <div>
                <label className={labelCls}>YouTube URL</label>
                <input value={videoInfo.video_url} onChange={(e) => setVideoInfo((p: any) => ({...p, video_url: e.target.value}))} className={inputCls} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg flex gap-2">
                <Upload size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  서버에 직접 영상 파일을 업로드합니다. MP4, WebM 형식을 지원하며, 최대 50MB까지 업로드할 수 있습니다. 업로드 전 서버 스토리지 잔여 용량을 반드시 확인해 주세요.
                </p>
              </div>
              <div>
                <label className={labelCls}>비디오 파일</label>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-primary/50 transition-all cursor-pointer">
                  <input type="file" accept="video/*" className="sr-only" id="video-upload"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setVideoFile(f); setVideoInfo((p: any) => ({...p, video_url: f.name})); } e.target.value = ''; }}
                  />
                  <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload size={24} className={videoFile ? "text-primary" : (isEditMode && videoInfo.video_url && uploadType === 'direct' ? "text-green-500" : "text-muted-foreground")} />
                    <p className="text-sm font-medium">
                      {videoFile 
                        ? videoFile.name 
                        : (isEditMode && videoInfo.video_url && uploadType === 'direct') 
                          ? '기존 업로드 영상 유지 중 (클릭 시 교체)' 
                          : '영상 파일을 선택하세요'}
                    </p>
                    <p className="text-xs text-muted-foreground">MP4, WebM (최대 50MB)</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 구간 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>구간 시작 (초)</label>
              <input type="number" value={videoInfo.video_start_time} onChange={(e) => setVideoInfo((p: any) => ({...p, video_start_time: Number(e.target.value)}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>구간 종료 (초)</label>
              <input type="number" value={videoInfo.video_end_time} onChange={(e) => setVideoInfo((p: any) => ({...p, video_end_time: Number(e.target.value)}))} className={inputCls} />
            </div>
          </div>
        </div>

        {/* 이전/다음 버튼 */}
        <div className="flex justify-between">
          <button type="button" onClick={() => setActiveTab('basic')} className={btnOutline}>← 기본 정보</button>
          <button type="button" onClick={() => setActiveTab('content')} className={btnPrimary}>다음: 학습 내용 <ChevronDown size={14} className="-rotate-90" /></button>
        </div>
      </div>

      {/* ═══════════ TAB 3: 학습 내용 ═══════════ */}
      <div className={activeTab === 'content' ? 'space-y-6' : 'hidden'}>

        {/* ── 자막 섹션 ── */}
        <div className="bg-background rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen size={16} className="text-primary" /> 영상 자막
              <span className="text-xs text-muted-foreground font-normal ml-1">({subtitles.length}개)</span>
            </h3>
            <button type="button" onClick={addSubtitle} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all">
              <Plus size={14} /> 추가
            </button>
          </div>

          {subtitles.length === 0 && (
            <div className="py-10 text-center text-muted-foreground border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
              <BookOpen size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium mb-1">등록된 자막이 없습니다</p>
              <button type="button" onClick={addSubtitle} className="text-xs text-primary hover:underline">+ 자막 추가</button>
            </div>
          )}

          {/* 모바일 카드 레이아웃 */}
          <div className="md:hidden space-y-3">
             {subtitles.map((sub, idx) => (
              <MemoSubtitleMobile key={idx} sub={sub} idx={idx} updateSubtitle={updateSubtitle} removeSubtitle={removeSubtitle} />
            ))}
          </div>

          {/* 데스크톱 테이블 레이아웃 */}
          {subtitles.length > 0 && (
            <div className="hidden md:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-secondary/50">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20">시작 (초)</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20">종료 (초)</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">한국어 자막</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">영어 자막</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">발음 기호</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {subtitles.map((sub, idx) => (
                    <MemoSubtitleDesktop key={idx} sub={sub} idx={idx} updateSubtitle={updateSubtitle} removeSubtitle={removeSubtitle} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── 문화 노트 섹션 ── */}
        <div className="bg-background rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen size={16} className="text-primary" /> 문화 노트
              <span className="text-xs text-muted-foreground font-normal ml-1">({cultureNotes.length}개)</span>
            </h3>
            <button type="button" onClick={addCultureNote} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all">
              <Plus size={14} /> 추가
            </button>
          </div>

          {cultureNotes.length === 0 && (
            <div className="py-10 text-center text-muted-foreground border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
              <BookOpen size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium mb-1">등록된 문화 노트가 없습니다</p>
              <button type="button" onClick={addCultureNote} className="text-xs text-primary hover:underline">+ 새 노트 추가</button>
            </div>
          )}

          {cultureNotes.map((note, idx) => (
            <div key={idx} className="bg-secondary/20 rounded-lg p-4 border border-gray-100 dark:border-gray-800 relative">
              <button type="button" onClick={() => removeCultureNote(idx)} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all">
                <Trash2 size={14} />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>노트 제목</label>
                  <input className={inputCls} placeholder="문화 요소 제목" value={note.title} onChange={(e) => updateCultureNote(idx, 'title', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>부제목</label>
                  <input className={inputCls} placeholder="한 줄 요약" value={note.subtitle} onChange={(e) => updateCultureNote(idx, 'subtitle', e.target.value)} />
                </div>
              </div>

              {/* 콘텐츠 문단들 */}
              <div className="space-y-2">
                <label className={labelCls}>상세 내용</label>
                {note.contentRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-2 items-start">
                    <span className="w-6 h-8 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{rIdx + 1}</span>
                    <textarea
                      className={`${inputCls} resize-none min-h-[60px]`}
                      placeholder="문화적 배경을 상세히 적어주세요"
                      value={row.content_value}
                      onChange={(e) => updateContentRow(idx, rIdx, e.target.value)}
                    />
                    {note.contentRows.length > 1 && (
                      <button type="button" onClick={() => removeContentRow(idx, rIdx)} className="p-1 text-muted-foreground hover:text-red-500 mt-1"><Trash2 size={12} /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addContentRow(idx)} className="text-xs text-primary hover:underline flex items-center gap-1 ml-6">
                  <Plus size={12} /> 문단 추가
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── 어휘 섹션 ── */}
        <div className="bg-background rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-primary" /> 주요 어휘
              <span className="text-xs text-muted-foreground font-normal ml-1">({words.length}개)</span>
            </h3>
            <button type="button" onClick={addWord} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all">
              <Plus size={14} /> 추가
            </button>
          </div>

          {words.length === 0 && (
            <div className="py-10 text-center text-muted-foreground border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
              <FileText size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium mb-1">등록된 단어가 없습니다</p>
              <button type="button" onClick={addWord} className="text-xs text-primary hover:underline">+ 단어 추가</button>
            </div>
          )}

          {/* 모바일 카드 레이아웃 */}
          <div className="md:hidden space-y-3">
            {words.map((word, idx) => (
              <div key={idx} className="bg-secondary/20 rounded-lg p-4 border border-gray-100 dark:border-gray-800 relative">
                <button type="button" onClick={() => removeWord(idx)} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 rounded-md"><Trash2 size={14} /></button>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>단어</label>
                    <input value={word.words} onChange={(e) => updateWord(idx, 'words', e.target.value)} className={`${inputCls} font-bold text-primary`} placeholder="안녕하세요" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>의미</label>
                      <input value={word.means} onChange={(e) => updateWord(idx, 'means', e.target.value)} className={inputCls} placeholder="Hello" />
                    </div>
                    <div>
                      <label className={labelCls}>품사</label>
                      <input value={word.parts_of_speech} onChange={(e) => updateWord(idx, 'parts_of_speech', e.target.value)} className={inputCls} placeholder="인사말" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>발음</label>
                    <input value={word.pronunciation} onChange={(e) => updateWord(idx, 'pronunciation', e.target.value)} className={inputCls} placeholder="[an-nyeong-ha-se-yo]" />
                  </div>
                  <div>
                    <label className={labelCls}>예문</label>
                    <input value={word.example} onChange={(e) => updateWord(idx, 'example', e.target.value)} className={inputCls} placeholder="예문을 입력하세요" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 데스크톱 테이블 레이아웃 */}
          {words.length > 0 && (
            <div className="hidden md:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-secondary/50">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">단어</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">의미</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">품사</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">발음</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">예문</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {words.map((word, idx) => (
                    <tr key={idx} className="hover:bg-primary/[0.02] group">
                      <td className="px-3 py-2"><input value={word.words} onChange={(e) => updateWord(idx, 'words', e.target.value)} className="w-full px-2 py-1.5 text-sm font-semibold text-primary bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" placeholder="단어" /></td>
                      <td className="px-3 py-2"><input value={word.means} onChange={(e) => updateWord(idx, 'means', e.target.value)} className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" placeholder="의미" /></td>
                      <td className="px-3 py-2"><input value={word.parts_of_speech} onChange={(e) => updateWord(idx, 'parts_of_speech', e.target.value)} className="w-full px-2 py-1.5 text-xs bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" placeholder="품사" /></td>
                      <td className="px-3 py-2"><input value={word.pronunciation} onChange={(e) => updateWord(idx, 'pronunciation', e.target.value)} className="w-full px-2 py-1.5 text-xs font-mono text-muted-foreground bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" placeholder="[발음]" /></td>
                      <td className="px-3 py-2"><input value={word.example} onChange={(e) => updateWord(idx, 'example', e.target.value)} className="w-full px-2 py-1.5 text-xs bg-transparent border border-transparent hover:border-gray-200 focus:border-primary/50 focus:bg-background rounded-md outline-none" placeholder="예문" /></td>
                      <td className="px-3 py-2 text-center"><button type="button" onClick={() => removeWord(idx)} className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 이전/저장 버튼 */}
        <div className="flex justify-between pt-6">
          <button type="button" onClick={() => setActiveTab('source')} className={btnOutline}>← 영상 소스</button>
          <button type="submit" disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            {isEditMode ? '수정 완료' : '콘텐츠 등록'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AdminStudyUpload;
