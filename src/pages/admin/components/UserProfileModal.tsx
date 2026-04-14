import React from 'react';
import Modal from '@/components/common/Modal';
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Shield, 
  Clock, 
  Users, 
  Info,
  Globe,
  Circle,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { usePresence } from '@/contexts/PresenceContext';
import { getErrorMessage } from '@/utils/errorMessage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    profile_id?: string;
    nickname: string;
    avatar_url: string | null;
    banner_url: string | null;
    email: string;
    is_admin: boolean;
    followers_count: number;
    following_count: number;
    bio: string | null;
    country: string | null;
    country_name: string | null;
    country_flag_url: string | null;
    gender: string | null;
    birthday: string | null;
    last_active_at: string | null;
    last_sign_in_at: string | null;
    created_at: string;
    location: string | null;
  } | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
  const { isUserOnline } = usePresence();
  const [tracking, setTracking] = React.useState<any>(null); // Keeping any for complex traffic log
  const [trackingLoading, setTrackingLoading] = React.useState(false);
  
  React.useEffect(() => {
    const fetchTracking = async () => {
      if (!user?.profile_id && !user?.id) return;
      setTrackingLoading(true);
      try {
        const targetId = user.profile_id || user.id;
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await (supabase.from('traffic_logs') as any).select('*').eq('user_id', targetId).order('created_at', { ascending: true }).limit(1).maybeSingle();
        if (error) throw error;
        setTracking(data);
      } catch (error: unknown) {
        console.error('Error fetching tracking data:', getErrorMessage(error));
      } finally {
        setTrackingLoading(false);
      }
    };
    if (isOpen) fetchTracking();
  }, [user, isOpen]);

  if (!user) return null;

  const isOnline = isUserOnline(user.profile_id || user.id);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '정보 없음';
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (error: unknown) {
      console.warn('Date formatting error:', getErrorMessage(error));
      return dateString;
    }
  };

  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'Male': return '남성';
      case 'Female': return '여성';
      default: return '미설정';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="사용자 상세 프로필" className="max-w-2xl h-auto">
      <div className="overflow-hidden">
        {/* Banner with Profile Image Overlay */}
        <div className="relative h-48 bg-zinc-200 dark:bg-zinc-800">
          {user.banner_url ? (
            <img src={user.banner_url} alt="banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <Globe size={64} />
            </div>
          )}
          
          <div className="absolute -bottom-12 left-8 p-1 bg-white dark:bg-zinc-900 rounded-full shadow-lg">
            <div className="relative w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 overflow-hidden shadow-inner">
              <img 
                src={user.avatar_url || '/images/default-avatar.svg'} 
                alt="avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-16 pb-8 px-8 space-y-8">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-4">
                <div className="relative">
                  {user.nickname}
                  <div 
                    className={`absolute top-0.5 -right-3 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300'}`} 
                    title={isOnline ? '온라인' : '오프라인'} 
                  />
                </div>
                {user.is_admin && (
                  <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-[10px] rounded-full flex items-center gap-1 font-bold border border-violet-200 dark:border-violet-800">
                    <Shield size={10} /> 관리자
                  </span>
                )}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1">
                <Mail size={14} /> {user.email}
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{user.followers_count || 0}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">팔로워</p>
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{user.following_count || 0}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">팔로잉</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
               <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed italic">
                 "{user.bio}"
               </p>
            </div>
          )}

          {/* Detailed Stats Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem 
              icon={<Globe size={16} />} 
              label="국적" 
              value={user.country_name || user.country || '미설정'} 
              img={user.country_flag_url}
            />
            <InfoItem icon={<User size={16} />} label="성별" value={getGenderLabel(user.gender)} />
            <InfoItem icon={<Calendar size={16} />} label="생년월일" value={user.birthday || '정보 없음'} />
            <InfoItem icon={<Circle size={16} className={isOnline ? 'text-emerald-500' : 'text-zinc-400'} />} label="상태" value={isOnline ? '현재 온라인' : '오프라인'} />
            <InfoItem icon={<Clock size={16} />} label="마지막 접속" value={formatDate(user.last_active_at)} />
            <InfoItem icon={<Clock size={16} />} label="마지막 로그인" value={formatDate(user.last_sign_in_at)} />
            <InfoItem icon={<Calendar size={16} />} label="가입일" value={formatDate(user.created_at)} />
            <InfoItem icon={<MapPin size={16} />} label="위치" value={user.location || '정보 없음'} />
          </div>

          {/* Acquisition Tracking Details */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
             <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <Globe size={16} className="text-emerald-500" /> 최초 접속 유입 경로 (Acquisition)
             </h3>
             {trackingLoading ? (
                <div className="h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl animate-pulse flex items-center justify-center text-xs text-zinc-400">데이터를 분석 중입니다...</div>
             ) : tracking ? (
                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Globe size={80} className="text-emerald-500" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 relative z-10">
                      <div>
                         <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">유입 소스 (UTM_SOURCE)</span>
                         <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{tracking.utm_source || '직접 접속 (Direct)'}</span>
                      </div>
                      <div>
                         <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">매체 (UTM_MEDIUM)</span>
                         <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{tracking.utm_medium || '-'}</span>
                      </div>
                      {tracking.utm_campaign && (
                        <div className="col-span-2">
                           <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">캠페인 (UTM_CAMPAIGN)</span>
                           <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{tracking.utm_campaign}</span>
                        </div>
                      )}
                      <div className="col-span-2 mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/30">
                         <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">최초 접속 랜딩 페이지</span>
                         <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 break-all">{tracking.landing_page || '정보 없음'}</span>
                      </div>
                      {tracking.referrer && tracking.referrer !== 'direct' && (
                         <div className="col-span-2 mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/30">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">이전 참조 사이트 (Referrer)</span>
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 break-all">{tracking.referrer}</span>
                         </div>
                      )}
                      <div className="col-span-2 mt-2">
                         <span className="text-[10px] text-zinc-500 flex justify-end">추적 일시: {formatDate(tracking.created_at)}</span>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-center text-sm text-zinc-500">
                   기록된 유입 트래킹 데이터가 없습니다. (최근 연동된 시스템이거나 Ad-block 영향일 수 있습니다)
                </div>
             )}
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button 
              onClick={() => window.open(`/profile/${user.nickname}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-bold transition-all"
            >
              <ExternalLink size={16} /> 사이트에서 프로필 보기
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const InfoItem = ({ icon, label, value, img }: { icon: React.ReactNode, label: string, value: string, img?: string | null }) => (
  <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-50 dark:border-zinc-800 shadow-sm">
    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">{label}</p>
      <div className="flex items-center gap-2">
        {img && <img src={img} alt="" className="w-4 h-3 object-cover rounded-sm" />}
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{value}</p>
      </div>
    </div>
  </div>
);

export default UserProfileModal;
