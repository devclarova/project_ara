import { useEffect, useMemo, useState } from 'react';
import type { ProfileData } from '@/types/profile';
import { defaultProfile, toProfileData } from '@/types/profileMapper';
import {
  fetchMyProfileRow,
  getSessionUserId,
  seedProfileIfMissing,
  upsertMyProfile,
} from '@/types/profileService';

export function useProfile(initial?: ProfileData) {
  const [userId, setUserId] = useState<string | null>(null);
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // 화면 표시용 ProfileData
  const profile: ProfileData = useMemo(() => {
    if (!raw) return initial ?? defaultProfile;
    return toProfileData(raw, initial ?? defaultProfile);
  }, [raw, initial]);

  // 초기 로딩: 세션 → 프로필 조회 → 없으면 seed
  useEffect(() => {
    (async () => {
      setLoading(true);
      const uid = await getSessionUserId();
      setUserId(uid);

      if (uid) {
        const row = await fetchMyProfileRow(uid);
        if (row) {
          setRaw(row);
        } else {
          const created = await seedProfileIfMissing(uid);
          setRaw(created);
        }
      } else {
        setRaw(null); // 비로그인
      }
      setLoading(false);
    })();
  }, []);

  // 저장 핸들러: DB upsert → raw 갱신
  const save = async (form: {
    name?: string;
    bio?: string;
    birth?: string;
    gender?: string;
    country?: string;
    avatarUrl?: string;
    coverUrl?: string;
    website?: string;
  }) => {
    if (!userId) return false;
    const updated = await upsertMyProfile(userId, form, raw);
    if (updated) {
      setRaw(updated);
      return true;
    }
    return false;
  };

  return {
    profile,
    userId,
    loading,
    isEditOpen,
    openEdit: () => userId && setIsEditOpen(true),
    closeEdit: () => setIsEditOpen(false),
    save,
  };
}
