import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';

interface FFFTweetComposerProps {
  onPost?: (newTweet: any) => void;
}

/** --------------------------
 *  Quill + Supabase 즉시 업로드 버전
 * -------------------------- */
const RichTextEditor = ({
  value,
  onChange,
  placeholder = '내용을 입력하세요.',
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const quilRef = useRef<ReactQuill | null>(null);

  // ✅ 이미지 선택 → 바로 Supabase 업로드
  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const quill = quilRef.current?.getEditor();
      if (!quill) return;

      // 에디터 커서 위치
      const range = quill.getSelection(true);
      // 임시로 "업로드 중..." 텍스트 표시
      quill.insertText(range.index, '이미지 업로드 중...', 'italic', true);

      try {
        const safeName = file.name.replace(/[^\w\-_.]/g, '_').substring(0, 40);
        const filePath = `uploads/${Date.now()}_${safeName}`;

        const { error } = await supabase.storage.from('tweets').upload(filePath, file);
        if (error) throw error;

        const { data } = supabase.storage.from('tweets').getPublicUrl(filePath);
        const imageUrl = data.publicUrl;

        // "업로드 중..." 문구 제거 후 실제 이미지 삽입
        quill.deleteText(range.index, '이미지 업로드 중...'.length);
        quill.insertEmbed(range.index, 'image', imageUrl);
        quill.setSelection(range.index + 1);
      } catch (err: any) {
        console.error('이미지 업로드 실패:', err.message);
        alert('이미지 업로드 실패: ' + err.message);
      }
    };
  }, []);

  // Quill 툴바 설정
  const modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload, // ✅ 이미지 버튼 커스터마이징
      },
    },
  };

  return (
    <ReactQuill
      ref={quilRef}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      placeholder={placeholder}
      readOnly={disabled}
    />
  );
};

/** --------------------------
 *  FFFTweetComposer
 * -------------------------- */
export default function FFFTweetComposer({ onPost }: FFFTweetComposerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ id: string; nickname: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => data && setProfile(data));
  }, [user]);

  const handleSubmit = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { data: insertedTweet, error } = await supabase
        .from('tweets')
        .insert([{ author_id: profile?.id, content }])
        .select(`
          id, content, created_at,
          profiles:author_id (nickname, avatar_url)
        `)
        .single();

      if (error) throw error;

      onPost?.(insertedTweet);
      setContent('');
    } catch (err) {
      console.error('게시 실패:', err);
      alert('게시 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500 border rounded-lg">
        <p>트윗을 작성하려면 로그인해주세요.</p>
        <Button onClick={() => navigate('/signin')} className="bg-blue-500 text-white mt-2">
          로그인하기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4  border-gray-200 bg-white rounded-xl">
      <RichTextEditor value={content} onChange={setContent} disabled={loading} />
      <div className="flex justify-end mt-3">
        <Button disabled={loading} onClick={handleSubmit} className="bg-primary text-white rounded-full px-5">
          {loading ? '게시 중...' : '게시하기'}
        </Button>
      </div>
    </div>
  );
}
