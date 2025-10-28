// src/components/detail/ReplyComposerModal.tsx
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ReplyComposerModalProps {
  parentId: string;
  onSuccess?: () => void;
}

export default function ReplyComposerModal({ parentId, onSuccess }: ReplyComposerModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{
    id: string;
    nickname: string;
    avatar_url: string | null;
  } | null>(null);

  // ✅ 프로필 가져오기
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => data && setProfile(data));
  }, [user]);

  // ✅ 이미지 업로드 핸들러
  const quilRef = useRef<ReactQuill | null>(null);
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
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
  };

  // ✅ 댓글 등록
  const handleSubmit = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    if (!content.trim()) return alert('댓글을 입력해주세요.');

    setLoading(true);
    try {
      const { data, error } = await supabase
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

      setContent('');
      onSuccess?.();
    } catch (err) {
      console.error('댓글 등록 실패:', err);
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-4 border-gray-200 bg-white rounded-xl">
      <ReactQuill
        ref={quilRef}
        theme="snow"
        value={content}
        onChange={setContent}
        modules={modules}
        placeholder="댓글을 입력하세요."
        readOnly={loading}
      />
      <div className="flex justify-end mt-3">
        <Button
          disabled={loading}
          onClick={handleSubmit}
          className="bg-primary text-white rounded-full px-5"
        >
          {loading ? '게시 중...' : '댓글 달기'}
        </Button>
      </div>
    </div>
  );
}
