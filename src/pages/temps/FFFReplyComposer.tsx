// src/components/detail/FFFReplyComposer.tsx
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';

interface FFFReplyComposerProps {
  parentId: string; // ✅ 부모 트윗 id
  onReply?: (newReply: any) => void;
}

/** --------------------------
 *  Quill + Supabase 이미지 업로드 포함
 * -------------------------- */
const RichTextEditor = ({
  value,
  onChange,
  placeholder = '댓글을 입력하세요.',
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const quilRef = useRef<ReactQuill | null>(null);

  // ✅ 이미지 업로드
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

      const range = quill.getSelection(true);
      quill.insertText(range.index, '이미지 업로드 중...', 'italic', true);

      try {
        const safeName = file.name.replace(/[^\w\-_.]/g, '_').substring(0, 40);
        const filePath = `reply_uploads/${Date.now()}_${safeName}`;

        const { error } = await supabase.storage.from('tweets').upload(filePath, file);
        if (error) throw error;

        const { data } = supabase.storage.from('tweets').getPublicUrl(filePath);
        const imageUrl = data.publicUrl;

        quill.deleteText(range.index, '이미지 업로드 중...'.length);
        quill.insertEmbed(range.index, 'image', imageUrl);
        quill.setSelection(range.index + 1);
      } catch (err: any) {
        console.error('이미지 업로드 실패:', err.message);
        alert('이미지 업로드 실패: ' + err.message);
      }
    };
  }, []);

  const modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload,
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
 *  FFFReplyComposer
 * -------------------------- */
export default function FFFReplyComposer({ parentId, onReply }: FFFReplyComposerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{
    id: string;
    nickname: string;
    avatar_url: string | null;
  } | null>(null);

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
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // ✅ tweet_replies 테이블에 insert
      const { data: newReply, error } = await supabase
        .from('tweet_replies')
        .insert([
          {
            tweet_id: parentId,
            author_id: profile?.id,
            content,
          },
        ])
        .select(
          `
          id, content, created_at,
          profiles:author_id (nickname, avatar_url)
        `,
        )
        .single();

      if (error) throw error;

      onReply?.(newReply);
      setContent('');
    } catch (err) {
      console.error('댓글 작성 실패:', err);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500 border rounded-lg">
        <p>댓글을 작성하려면 로그인해주세요.</p>
        <Button onClick={() => navigate('/signin')} className="bg-blue-500 text-white mt-2">
          로그인하기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 border-gray-200 bg-white rounded-xl">
      <div>
        <RichTextEditor value={content} onChange={setContent} disabled={loading} />
      </div>
      <div className="flex justify-end mt-3">
        <Button
          disabled={loading}
          onClick={handleSubmit}
          className="bg-primary text-white rounded-full px-5"
        >
          {loading ? '작성 중...' : '등록'}
        </Button>
      </div>
    </div>
  );
}
