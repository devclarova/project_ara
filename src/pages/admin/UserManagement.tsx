import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { addYears, addDays } from 'date-fns';
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MapPin, 
  Calendar,
  Shield,
  Ban,
  CheckCircle2,
  Mail,
  MoreVertical,
  X,
  RotateCw,
  Eye,
  History as HistoryIcon,
  Globe,
  Clock,
  Trash2,
  User,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import SanctionDialog from './components/SanctionDialog';
import UserReportsListModal from './components/UserReportsListModal';
import SanctionHistoryModal from './components/SanctionHistoryModal';
import AdminUserActivityModal from './components/AdminUserActivityModal';
import UserProfileModal from './components/UserProfileModal';
import CheckboxSquare from '@/components/common/CheckboxSquare';
import AddUserModal from './components/AddUserModal';

interface AdminUser {
  id: string;
  profile_id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  is_admin: boolean;
  banned_until: string | null;
  country: string | null;
  country_name: string | null;
  gender: string | null;
  birthday: string | null;
  is_online: boolean;
  last_active_at: string | null;
  bio: string | null;
  location: string | null;
  followers_count: number;
  following_count: number;
  banner_url: string | null;
  country_flag_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  total_count: number;
  received_reports_count: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Ban Dialog State
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [reportModalMode, setReportModalMode] = useState<'sent' | 'received'>('received');
  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [banDuration, setBanDuration] = useState<number | 'permanent' | 'custom'>(1);
  const [customDays, setCustomDays] = useState('');
  const [isBanProcessing, setIsBanProcessing] = useState(false);
  const [sanctionMode, setSanctionMode] = useState<'ban' | 'unban'>('ban');

  const openBanDialog = (user: AdminUser) => {
      setTargetUser(user);
      setSanctionMode('ban');
      setShowBanDialog(true);
  };

  const openUnbanDialog = (user: AdminUser) => {
      setTargetUser(user);
      setSanctionMode('unban');
      setShowBanDialog(true);
  };

  // Filters & Pagination


  // Filters & Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [bannedCount, setBannedCount] = useState(0);
  const [reportedCount, setReportedCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [newUserCount, setNewUserCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterOnline, setFilterOnline] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterBirthday, setFilterBirthday] = useState('All');
  const [filterCreatedAt, setFilterCreatedAt] = useState('All');
  const [sortBy, setSortBy] = useState('last_active_desc');

  const modalUser = useMemo(() => targetUser ? { 
    id: targetUser.id, 
    profile_id: targetUser.profile_id, 
    nickname: targetUser.nickname 
  } : null, [targetUser?.id]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list', {
        page: page,
        per_page: ITEMS_PER_PAGE,
        search_term: searchTerm,
        filter_role: filterRole,
        filter_status: filterStatus,
        filter_gender: filterGender,
        filter_online: filterOnline,
        filter_country: filterCountry,
        filter_birthday: filterBirthday,
        filter_created_at: filterCreatedAt,
        sort_by: sortBy
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setUsers(data as AdminUser[]);
          setTotalCount(data[0].total_count);
          setAdminCount(data[0].global_admin_count || 0);
          setBannedCount(data[0].global_banned_count || 0);
          setReportedCount(data[0].global_reported_user_count || 0);
          setOnlineCount(data[0].global_online_count || 0);
          setNewUserCount(data[0].global_new_user_count || 0);
          setDeletedCount(data[0].global_deleted_count || 0);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterRole, filterStatus, filterGender, filterOnline, filterCountry, filterBirthday, filterCreatedAt, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Real-time status subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-users-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setUsers(currentUsers =>
            currentUsers.map(u => {
              // profiles 테이블의 기본 키는 'id'이며, 이는 AdminUser의 'profile_id'와 대응됩니다.
              if (u.profile_id === payload.new.id) {
                return {
                  ...u,
                  is_online: payload.new.is_online !== undefined ? payload.new.is_online : u.is_online,
                  last_active_at: payload.new.last_active_at || u.last_active_at,
                  nickname: payload.new.nickname || u.nickname,
                  avatar_url: payload.new.avatar_url || u.avatar_url,
                  banned_until: payload.new.banned_until || u.banned_until,
                  is_admin: payload.new.is_admin !== undefined ? payload.new.is_admin : u.is_admin
                };
              }
              return u;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on search
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterRole(e.target.value);
    setPage(1);
  };

  // Actions
  const handleToggleAdminRole = async (userId: string, currentIsAdmin: boolean) => {
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.id === userId) {
            toast.error('자기 자신의 권한은 변경할 수 없습니다.');
            return;
        }

        const { error } = await supabase.rpc('toggle_admin_role', { target_user_id: userId });
        if (error) throw error;

        toast.success(currentIsAdmin ? '관리자 권한이 해제되었습니다.' : '관리자 권한이 부여되었습니다.');
        setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u));
    } catch (error) {
        console.error('Error toggling role:', error);
        toast.error('권한 변경에 실패했습니다.');
    }
  };

  const handleUpdateBanStatus = async (userId: string, type: 'perm' | 'days' | 'unban', days?: number) => {
      // Logic handled by SanctionDialog
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('경고: 이 사용자를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 사용자의 모든 데이터가 즉시 삭제됩니다.')) {
        return;
    }

    try {
        const { error } = await supabase.rpc('delete_user', { target_user_id: userId });

        if (error) throw error;

        toast.success('사용자가 삭제되었습니다.');
        // Remove from list
        setUsers(users.filter(u => u.id !== userId));
        setTotalCount(prev => prev - 1);
    } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('사용자 삭제에 실패했습니다.');
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // Fetch all users matching current filters but without pagination (max 1000)
      const { data, error } = await supabase.rpc('get_admin_users_list', {
        page: 1,
        per_page: 1000, // Reasonable limit for CSV export
        search_term: searchTerm,
        filter_role: filterRole,
        filter_status: filterStatus,
        filter_gender: filterGender,
        filter_online: filterOnline,
        filter_country: filterCountry,
        filter_birthday: filterBirthday,
        filter_created_at: filterCreatedAt,
        sort_by: sortBy
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('내보낼 데이터가 없습니다.');
        return;
      }

      // Generate CSV content
      const headers = ['ID', 'Email', 'Nickname', 'Role', 'Status', 'CreatedAt', 'LastActive', 'Country', 'Gender', 'Birthday', 'Reports'];
      const csvRows = [headers.join(',')];

      data.forEach((u: any) => {
        const row = [
          u.id,
          u.email,
          `"${u.nickname.replace(/"/g, '""')}"`,
          u.is_admin ? 'Admin' : 'User',
          u.banned_until && new Date(u.banned_until) > new Date() ? 'Banned' : 'Active',
          format(new Date(u.created_at), 'yyyy-MM-dd HH:mm:ss'),
          u.last_active_at ? format(new Date(u.last_active_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
          u.country_name || 'N/A',
          u.gender || 'N/A',
          u.birthday || 'N/A',
          u.received_reports_count
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel Korean support
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `user_list_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('사용자 목록을 CSV로 내보냈습니다.');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('내보내기 중 오류가 발생했습니다.');
    } finally {
      setExportLoading(false);
    }
  };

  const statusFilterOptions = ['All', 'Active', 'Banned'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-primary/10 text-primary border-emerald-100 dark:border-emerald-800';
      case 'Banned': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800';
      case 'Inactive': return 'bg-muted text-muted-foreground border-gray-300 dark:border-gray-500 dark:border-border';
      case 'Reported': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800';
      default: return 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-600';
    }
  };

  const getRoleColor = (isAdmin: boolean) => {
    return isAdmin
      ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800'
      : 'text-muted-foreground bg-muted border-gray-300 dark:border-gray-500 dark:border-border';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">사용자 관리</h1>
          <p className="text-muted-foreground mt-1">총 <span className="font-semibold text-foreground">{totalCount}</span>명의 사용자가 등록되어 있습니다.</p>
        </div>
        <div className="flex items-center gap-2">
           <button
             onClick={fetchUsers}
             className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors font-medium text-sm"
             title="새로고침"
           >
             <RotateCw size={16} className={loading ? "animate-spin" : ""} />
           </button>
            <button 
              onClick={handleExportCSV}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border-2 border-gray-300 dark:border-gray-500 text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-accent700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {exportLoading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              내보내기
            </button>
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-emerald-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-800 transition-colors shadow-sm shadow-emerald-200 dark:shadow-emerald-900/20 font-medium text-sm"
            >
              <Plus size={16} />
              새 사용자 추가
            </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        {[
          { label: '전체 사용자', value: totalCount.toLocaleString(), trend: 'Total', color: 'blue' },
          { label: '온라인 사용자', value: onlineCount.toLocaleString(), trend: 'Online', color: 'emerald' },
          { label: '신규 사용자 (1주)', value: newUserCount.toLocaleString(), trend: 'New', color: 'violet' },
          { label: '탈퇴 신청자 (1주)', value: deletedCount.toLocaleString(), trend: 'Withdrawal', color: 'rose' },
          { label: '신고된 사용자', value: reportedCount.toLocaleString(), trend: 'Reported', color: 'amber' },
          { label: '정지된 사용자', value: bannedCount.toLocaleString(), trend: 'Banned', color: 'red' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-secondary p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground break-keep">{stat.label}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-2">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-secondary rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm overflow-hidden">

        {/* Filters Toolbar */}
        <div className="p-5 border-b border-gray-300 dark:border-gray-600 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="이메일, 닉네임으로 검색..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl focus:bg-white dark:focus:bg-muted focus:border-primary transition-all outline-none text-sm text-foreground focus:ring-4 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold text-foreground outline-none focus:outline-none ring-0">
                    <Shield size={16} className="text-muted-foreground" />
                    <span>{filterRole === 'All' ? '모든 권한' : (filterRole === 'Admin' ? '관리자' : '일반 사용자')}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-52 bg-white/95 dark:bg-secondary/95 backdrop-blur-md border-neutral-200 dark:border-zinc-700 rounded-xl shadow-2xl outline-none ring-0 focus:ring-0 focus-visible:ring-0 z-[100]" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuRadioGroup value={filterRole} onValueChange={setFilterRole}>
                    <DropdownMenuRadioItem value="All" className="focus:bg-primary/5 focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent cursor-pointer">모든 권한</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Admin" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">관리자</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="User" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">일반 사용자</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>

             {/* Status Filter */}
             <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold text-foreground outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-gray-400 border-2 ring-0 ring-offset-0">
                    <Ban size={16} className="text-muted-foreground" />
                    <span>{filterStatus === 'All' ? '모든 상태' : (filterStatus === 'Active' ? '활성 계정' : '차단된 계정')}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-52 bg-white/95 dark:bg-secondary/95 backdrop-blur-md border-neutral-200 dark:border-zinc-700 rounded-xl shadow-2xl outline-none ring-0 focus:ring-0 focus-visible:ring-0 z-[100]" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuRadioGroup value={filterStatus} onValueChange={setFilterStatus}>
                    <DropdownMenuRadioItem value="All" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">모든 상태</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Active" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">활성 계정</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Banned" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">차단된 계정</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>

             {/* Online Filter */}
             <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold text-foreground outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-gray-400 border-2 ring-0 ring-offset-0">
                    <div className={`w-2 h-2 rounded-full ${filterOnline === 'Online' ? 'bg-emerald-500' : filterOnline === 'Offline' ? 'bg-zinc-400' : 'bg-muted-foreground'}`} />
                    <span>{filterOnline === 'All' ? '접속 상태' : (filterOnline === 'Online' ? '온라인 전용' : '오프라인 전용')}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-52 bg-white/95 dark:bg-secondary/95 backdrop-blur-md border-neutral-200 dark:border-zinc-700 rounded-xl shadow-2xl outline-none ring-0 focus:ring-0 focus-visible:ring-0 z-[100]" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuRadioGroup value={filterOnline} onValueChange={setFilterOnline}>
                    <DropdownMenuRadioItem value="All" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">모든 접속 상태</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Online" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">온라인 사용자</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Offline" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">오프라인 사용자</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>

             {/* Gender Filter */}
             <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold text-foreground outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-gray-400 border-2 ring-0 ring-offset-0">
                    <User size={16} className="text-muted-foreground" />
                    <span>{filterGender === 'All' ? '모든 성별' : (filterGender === 'Male' ? '남성' : '여성')}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-52 bg-white/95 dark:bg-secondary/95 backdrop-blur-md border-neutral-200 dark:border-zinc-700 rounded-xl shadow-2xl outline-none ring-0 focus:ring-0 focus-visible:ring-0 z-[100]" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuRadioGroup value={filterGender} onValueChange={setFilterGender}>
                    <DropdownMenuRadioItem value="All" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">모든 성별</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Male" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">남성</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Female" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">여성</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>

             {/* Country Filter (Sample) */}
             <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold text-foreground outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-gray-400 border-2 ring-0 ring-offset-0">
                    <Globe size={16} className="text-muted-foreground" />
                    <span>{filterCountry === 'All' ? '모든 국적' : filterCountry}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto bg-white/95 dark:bg-secondary/95 backdrop-blur-sm border-gray-100/80 dark:border-gray-700/70 rounded-xl shadow-xl outline-none ring-0">
                  <DropdownMenuRadioGroup value={filterCountry} onValueChange={setFilterCountry}>
                    <DropdownMenuRadioItem value="All" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">모든 국적</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="KR" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">대한민국 (KR)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="JP" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">일본 (JP)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="US" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">미국 (US)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>

             {/* Birthday Filter (Age Group) */}
             <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold text-foreground outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-gray-400 border-2 ring-0 ring-offset-0">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>{
                      filterBirthday === 'All' ? '전체 연령대' :
                      filterBirthday === '10s' ? '만 10대' :
                      filterBirthday === '20s' ? '만 20대' :
                      filterBirthday === '30s' ? '만 30대' :
                      filterBirthday === '40s' ? '만 40대' : '만 50대 이상'
                    }</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-52 bg-white/95 dark:bg-secondary/95 backdrop-blur-md border-neutral-200 dark:border-zinc-700 rounded-xl shadow-2xl outline-none ring-0 focus:ring-0 focus-visible:ring-0 z-[100]" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuRadioGroup value={filterBirthday} onValueChange={setFilterBirthday}>
                    <DropdownMenuRadioItem value="All" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">전체 연령대</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="10s" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">만 10대</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="20s" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">만 20대</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="30s" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">만 30대</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="40s" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">만 40대</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="50s" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">만 50대 이상</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>

             {/* CreatedAt Filter (Period) */}
             <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold text-foreground outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-gray-400 border-2 ring-0 ring-offset-0">
                    <HistoryIcon size={16} className="text-muted-foreground" />
                    <span>{
                      filterCreatedAt === 'All' ? '전체 가입 기간' :
                      filterCreatedAt === 'Today' ? '오늘 가입' :
                      filterCreatedAt === 'Week' ? '최근 1주일' :
                      filterCreatedAt === 'Month' ? '최근 1개월' : '최근 1년'
                    }</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-white/95 dark:bg-secondary/95 backdrop-blur-sm border-gray-100/80 dark:border-gray-700/70 rounded-xl shadow-xl outline-none ring-0">
                  <DropdownMenuRadioGroup value={filterCreatedAt} onValueChange={setFilterCreatedAt}>
                    <DropdownMenuRadioItem value="All" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">전체 가입 기간</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Today" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">오늘 가입</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Week" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">최근 1주일</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Month" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">최근 1개월</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Year" className="focus:bg-primary/5 focus:outline-none focus:ring-0 cursor-pointer">최근 1년</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>

             {/* Sort Select */}
             <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold text-foreground outline-none border-2">
                    <RotateCw size={16} className="text-muted-foreground" />
                    <span>{
                      sortBy === 'created_at_desc' ? '가입일 최신순' :
                      sortBy === 'created_at_asc' ? '가입일 오래된순' :
                      sortBy === 'nickname_asc' ? '닉네임 가나다순' :
                      sortBy === 'nickname_desc' ? '닉네임 하타파순' :
                      sortBy === 'last_active_desc' ? '최근 활동순' :
                      sortBy === 'reports_desc' ? '신고 많은순' :
                      sortBy === 'followers_desc' ? '팔로워 많은순' :
                      sortBy === 'following_desc' ? '팔로잉 많은순' : '정렬 기준'
                    }</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-secondary/95 backdrop-blur-sm border-gray-100/80 dark:border-gray-700/70 rounded-xl shadow-xl outline-none ring-0">
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                    <DropdownMenuRadioItem value="created_at_desc" className="focus:bg-primary/5 focus:outline-none cursor-pointer">가입일 최신순</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created_at_asc" className="focus:bg-primary/5 focus:outline-none cursor-pointer">가입일 오래된순</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="nickname_asc" className="focus:bg-primary/5 focus:outline-none cursor-pointer">닉네임 가나다순</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="nickname_desc" className="focus:bg-primary/5 focus:outline-none cursor-pointer">닉네임 하타파순</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="last_active_desc" className="focus:bg-primary/5 focus:outline-none cursor-pointer">최근 활동순</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="reports_desc" className="focus:bg-primary/5 focus:outline-none cursor-pointer">신고 많은순</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="followers_desc" className="focus:bg-primary/5 focus:outline-none cursor-pointer">팔로워 많은순</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="following_desc" className="focus:bg-primary/5 focus:outline-none cursor-pointer">팔로잉 많은순</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-gray-300 dark:border-gray-600 dark:border-border">
                <th className="px-6 py-4 w-12 whitespace-nowrap">
                  <CheckboxSquare
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(checked) => {
                      if (checked) setSelectedUsers(users.map(u => u.id));
                      else setSelectedUsers([]);
                    }}
                  />
                </th>
                <th className="px-6 py-4 whitespace-nowrap">사용자 정보</th>
                <th className="px-6 py-4 whitespace-nowrap">국적/성별</th>
                <th className="px-6 py-4 whitespace-nowrap">생년월일</th>
                <th className="px-6 py-4 whitespace-nowrap">권한</th>
                <th className="px-6 py-4 whitespace-nowrap">상태/접속</th>
                <th className="px-6 py-4 whitespace-nowrap">가입일/마지막 활동</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && users.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="py-20 text-center text-muted-foreground">
                        <RotateCw className="animate-spin w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>데이터를 불러오는 중입니다...</p>
                    </td>
                 </tr>
              ) : users.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="py-20 text-center text-muted-foreground">
                        <p className="font-medium mb-1">검색 결과가 없습니다.</p>
                        <p className="text-xs opacity-70">
                            만약 모든 사용자가 보이지 않는다면, SQL 마이그레이션(20250131_...)이 적용되었는지 확인해주세요.<br/>
                            또는 현재 계정이 관리자 권한을 가지고 있는지 확인바랍니다.
                        </p>
                    </td>
                 </tr>
              ) : (
              users.map((user) => {
                 const isUserBanned = user.banned_until && new Date(user.banned_until) > new Date();
                 const statusLabel = isUserBanned ? 'Banned' : 'Active';
                 const roleLabel = user.is_admin ? 'Admin' : 'User';

                 return (
                <tr key={user.id} className="hover:bg-muted dark:hover:bg-accent700/50 transition-colors group">
                  <td className="px-6 py-4">
                    <CheckboxSquare
                      checked={selectedUsers.includes(user.id)}
                      onChange={(checked) => {
                        if (checked) setSelectedUsers([...selectedUsers, user.id]);
                        else setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => {
                          setTargetUser(user);
                          setShowUserProfileModal(true);
                        }}
                        className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-foreground font-bold border-2 border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:border-primary transition-all"
                      >
                        <img
                          src={user.avatar_url || '/images/default-avatar.svg'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className="cursor-pointer group/name"
                        onClick={() => {
                          setTargetUser(user);
                          setShowUserProfileModal(true);
                        }}
                      >
                        <p className="text-sm font-semibold text-foreground group-hover/name:text-primary transition-colors">{user.nickname}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {user.country_flag_url ? (
                          <img src={user.country_flag_url} alt="" className="w-4 h-3 object-cover rounded-sm shadow-sm" />
                        ) : (
                          <Globe size={12} className="text-zinc-400" />
                        )}
                        {user.country_name || user.country || '미설정'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium pl-6">
                        {user.gender === 'Male' ? '남성' : user.gender === 'Female' ? '여성' : '정보 없음'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      {user.birthday || '정보 없음'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleColor(user.is_admin)}`}>
                      {user.is_admin && <Shield size={12} />}
                      {user.is_admin ? '관리자' : '일반 사용자'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(statusLabel)}`}>
                        {!isUserBanned && <CheckCircle2 size={10} className="mr-1" />}
                        {isUserBanned && <Ban size={10} className="mr-1" />}
                        {isUserBanned ? '차단됨' : '정상'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">
                          {user.is_online ? '온라인' : '오프라인'}
                        </span>
                      </div>
                    </div>

                    {isUserBanned && (
                      <p className="text-[10px] text-red-500 mt-1 font-bold">
                        ~ {new Date(user.banned_until!).toLocaleDateString()}
                      </p>
                    )}
                    {user.received_reports_count > 0 && (
                      <div
                        className="mt-2 flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                        title="신고 내역 보기"
                        onClick={() => {
                          setTargetUser(user);
                          setReportModalMode('received');
                          setShowReportsModal(true);
                        }}
                      >
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[9px] font-black rounded border border-red-200 dark:border-red-800">
                           신고 {user.received_reports_count}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1.5 text-[11px] text-zinc-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-zinc-400" />
                        {new Date(user.created_at).toLocaleDateString()} 가입
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Clock size={12} />
                        {user.last_active_at ? format(new Date(user.last_active_at), 'yyyy-MM-dd HH:mm') : '최근 활동 없음'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right overflow-visible">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-muted-foreground hover:text-primary transition-all outline-none focus:outline-none border-none ring-0">
                                <MoreVertical size={16} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 bg-white/95 dark:bg-secondary/95 backdrop-blur-sm border-neutral-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden z-[200] outline-none ring-0 focus:ring-0 focus-visible:ring-0">
                            <DropdownMenuLabel className="text-xs text-muted-foreground px-4 py-2">회원 관리 메뉴</DropdownMenuLabel>

                            <DropdownMenuItem
                              className="px-4 py-2.5 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/20 transition-colors focus:outline-none focus:ring-0 focus:bg-primary/5 focus-visible:outline-none focus-visible:ring-0"
                              onClick={() => handleToggleAdminRole(user.id, user.is_admin)}
                            >
                                <span className="flex items-center gap-2 font-medium">
                                  <Shield size={14} className="text-zinc-400" />
                                  {user.is_admin ? '일반 사용자로 변경' : '관리자 권한 부여'}
                                </span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700/50" />

                            <DropdownMenuItem
                              className="px-4 py-2.5 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/20 transition-colors focus:outline-none focus:ring-0 focus:bg-primary/5 focus-visible:outline-none focus-visible:ring-0"
                              onClick={() => {
                                  setTargetUser(user);
                                  setShowActivityModal(true);
                              }}
                            >
                                <span className="font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                    <Eye size={14} className="text-zinc-400" /> 커뮤니티 활동 로그
                                </span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="px-4 py-2.5 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/20 transition-colors focus:outline-none focus:ring-0 focus:bg-primary/5 focus-visible:outline-none focus-visible:ring-0"
                              onClick={() => {
                                  setTargetUser(user);
                                  setShowUserProfileModal(true);
                              }}
                            >
                                <span className="font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                    <User size={14} className="text-zinc-400" /> 사용자 상세 프로필
                                </span>
                            </DropdownMenuItem>

                             <DropdownMenuItem
                               className="px-4 py-2.5 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/20 transition-colors focus:outline-none focus:ring-0 focus:bg-primary/5 focus-visible:outline-none focus-visible:ring-0"
                               onClick={() => {
                                   setTargetUser(user);
                                   setShowHistoryModal(true);
                               }}
                             >
                                 <span className="font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                     <HistoryIcon size={14} className="text-zinc-400" /> 누적 이용제한 이력
                                 </span>
                             </DropdownMenuItem>

                             <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700/50" />

                             <DropdownMenuItem
                               className="px-4 py-2.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors focus:outline-none focus:ring-0 focus:bg-red-50 focus-visible:outline-none focus-visible:ring-0"
                               onClick={() => {
                                   setTargetUser(user);
                                   setReportModalMode('received');
                                   setShowReportsModal(true);
                               }}
                             >
                                 <span className="font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                                     <ShieldAlert size={14} /> 피 신고 내역
                                 </span>
                             </DropdownMenuItem>

                             <DropdownMenuItem
                               className="px-4 py-2.5 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/20 transition-colors focus:outline-none focus:ring-0 focus:bg-primary/5 focus-visible:outline-none focus-visible:ring-0"
                               onClick={() => {
                                   setTargetUser(user);
                                   setReportModalMode('sent');
                                   setShowReportsModal(true);
                               }}
                             >
                                 <span className="font-bold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                     <ShieldAlert size={14} className="text-zinc-400" /> 신고한 내역
                                 </span>
                             </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700/50" />

                            {isUserBanned ? (
                                <DropdownMenuItem
                                  className="px-4 py-2.5 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors focus:outline-none focus:ring-0 focus:bg-green-50 focus-visible:outline-none focus-visible:ring-0"
                                  onClick={() => openUnbanDialog(user)}
                                >
                                    <span className="text-green-600 font-bold flex items-center gap-2">
                                      <CheckCircle2 size={14} /> 이용제한 즉시 해제
                                    </span>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                  className="px-4 py-2.5 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors focus:outline-none focus:ring-0 focus:bg-orange-50 focus-visible:outline-none focus-visible:ring-0"
                                  onClick={() => openBanDialog(user)}
                                >
                                    <span className="text-orange-600 font-bold flex items-center gap-2">
                                      <Ban size={14} /> 이용 제한 설정
                                    </span>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="px-4 py-2.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors focus:outline-none focus:ring-0 focus:bg-red-50 focus-visible:outline-none focus-visible:ring-0"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                                <span className="text-red-600 font-black flex items-center gap-2">
                                  <Trash2 size={14} /> 영구 계정 삭제
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
             })
             )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary */}
        <div className="px-6 py-4 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between">
           <p className="text-sm text-muted-foreground">
             <span className="font-bold text-primary">전체 {totalCount}명</span>의 사용자가 검색되었습니다.
           </p>
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-1">
               <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-sm text-muted-foreground hover:bg-muted dark:hover:bg-accent700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                  이전
               </button>
               <div className="min-w-[80px] text-center text-sm font-bold bg-muted px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                 {page} / {Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))}
               </div>
               <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * ITEMS_PER_PAGE >= totalCount}
                  className="px-3 py-1.5 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-sm text-muted-foreground hover:bg-muted dark:hover:bg-accent700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                  다음
               </button>
             </div>
           </div>
        </div>
      </div>


      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={() => {
          fetchUsers();
          setShowAddUserModal(false);
        }}
      />

      {/* Sanction Dialog */}
      <SanctionDialog
        isOpen={showBanDialog}
        onClose={() => setShowBanDialog(false)}
        targetUser={modalUser}
        mode={sanctionMode}
        onSuccess={(bannedUntil) => {
          if (targetUser) {
            setUsers(users.map(u => u.id === targetUser.id ? { ...u, banned_until: bannedUntil } : u));
          }
        }}
      />

      {/* Audit Modals */}
      <UserReportsListModal 
        isOpen={showReportsModal} 
        onClose={() => setShowReportsModal(false)} 
        user={modalUser} 
        mode={reportModalMode}
      />
      
      <SanctionHistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
        user={modalUser} 
      />

      <AdminUserActivityModal 
        isOpen={showActivityModal} 
        onClose={() => setShowActivityModal(false)} 
        user={modalUser} 
      />

      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        user={targetUser}
      />
    </div>
  );
};

export default UserManagement;
