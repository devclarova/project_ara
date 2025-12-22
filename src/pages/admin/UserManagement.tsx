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
  X
} from 'lucide-react';
import React, { useState } from 'react';

const UserManagement = () => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const users = [
    { id: 1, name: 'Sarah Wilson', email: 'sarah.w@example.com', role: 'Admin', status: 'Active', location: 'Seoul, KR', joined: '2023-11-12', avatar: 'S' },
    { id: 2, name: 'Michael Chen', email: 'm.chen@example.com', role: 'Editor', status: 'Active', location: 'Busan, KR', joined: '2023-12-05', avatar: 'M' },
    { id: 3, name: 'Emma Davis', email: 'emma.d@example.com', role: 'User', status: 'Banned', location: 'Incheon, KR', joined: '2024-01-15', avatar: 'E' },
    { id: 4, name: 'James Kim', email: 'james.kim@example.com', role: 'User', status: 'Active', location: 'Seoul, KR', joined: '2024-02-01', avatar: 'J' },
    { id: 5, name: 'Alex Rodriguez', email: 'alex.r@example.com', role: 'User', status: 'Inactive', location: 'Daegu, KR', joined: '2024-02-10', avatar: 'A' },
    { id: 6, name: 'Lisa Park', email: 'lisa.p@example.com', role: 'User', status: 'Active', location: 'Seoul, KR', joined: '2024-02-14', avatar: 'L' },
    { id: 7, name: 'David Lee', email: 'david.l@example.com', role: 'User', status: 'Reported', location: 'Gwangju, KR', joined: '2024-02-20', avatar: 'D' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-primary/10 text-primary border-emerald-100 dark:border-emerald-800';
      case 'Banned': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800';
      case 'Inactive': return 'bg-muted text-muted-foreground border-gray-300 dark:border-gray-500 dark:border-border';
      case 'Reported': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800';
      default: return 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-600';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800';
      case 'Editor': return 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 border-primary-100 dark:border-primary-800';
      default: return 'text-muted-foreground bg-muted border-gray-300 dark:border-gray-500 dark:border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">사용자 관리</h1>
          <p className="text-muted-foreground mt-1">총 <span className="font-semibold text-foreground">{users.length}</span>명의 사용자가 등록되어 있습니다.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-secondary border-2 border-gray-300 dark:border-gray-500 text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-accent700 transition-colors font-medium text-sm">
            <Download size={16} />
            내보내기
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-emerald-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-800 transition-colors shadow-sm shadow-emerald-200 dark:shadow-emerald-900/20 font-medium text-sm">
            <Plus size={16} />
            새 사용자 추가
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '전체 사용자', value: '1,234', trend: '+12%', color: 'blue' },
          { label: '활성 사용자', value: '892', trend: '+5%', color: 'emerald' },
          { label: '신고된 사용자', value: '23', trend: '+2', color: 'amber' },
          { label: '차단된 사용자', value: '12', trend: '-1', color: 'red' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-secondary p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
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
              placeholder="이름, 이메일로 검색..." 
              className="w-full pl-10 pr-4 py-2.5 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl focus:bg-white dark:focus:bg-muted focus:border-ring dark:focus:border-ring focus:ring-2 focus:ring-1 focus:ring-primary/30/50 dark:focus:ring-1 focus:ring-primary/30/50 transition-all outline-none text-sm text-foreground"
            />
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
             <div className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-lg">
                <Filter size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">필터:</span>
                <select 
                  className="bg-transparent border-none text-sm text-foreground font-medium focus:ring-0 cursor-pointer"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="All">모든 권한</option>
                  <option value="Admin">관리자</option>
                  <option value="Editor">에디터</option>
                  <option value="User">사용자</option>
                </select>
             </div>
             
             <div className="h-8 w-px bg-muted  hidden lg:block" />
             
             <div className="flex gap-2">
               {['Active', 'Banned'].map(status => (
                 <button 
                  key={status}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    filterStatus === status 
                      ? 'bg-muted  text-white border-gray-300 dark:border-gray-500 dark:border-border' 
                      : 'bg-secondary text-muted-foreground border-gray-300 dark:border-gray-500 hover:bg-muted dark:hover:bg-accent700'
                  }`}
                  onClick={() => setFilterStatus(filterStatus === status ? 'All' : status)}
                 >
                   {status === 'Active' ? '활성' : '차단됨'}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-gray-300 dark:border-gray-600 dark:border-border">
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-500 dark:border-border text-primary dark:text-primary focus:ring-1 focus:ring-primary/30/30 " />
                </th>
                <th className="px-6 py-4">사용자 정보</th>
                <th className="px-6 py-4">권한</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4">위치</th>
                <th className="px-6 py-4">가입일</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted dark:hover:bg-accent700/50 transition-colors group">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300 dark:border-gray-500 dark:border-border text-primary dark:text-primary focus:ring-1 focus:ring-primary/30/30 " />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold border-2 border-gray-300 dark:border-gray-500">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleColor(user.role)}`}>
                      {user.role === 'Admin' && <Shield size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                       {user.status === 'Active' && <CheckCircle2 size={12} className="mr-1" />}
                       {user.status === 'Banned' && <Ban size={12} className="mr-1" />}
                       {user.status === 'Reported' && <Shield size={12} className="mr-1" />}
                       {user.status}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={14} className="text-muted-foreground" />
                      {user.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar size={14} className="text-muted-foreground" />
                      {user.joined}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-accent dark:hover:bg-accent600 rounded-lg text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Visual) */}
        <div className="px-6 py-4 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between">
           <p className="text-sm text-muted-foreground">Showing <span className="font-semibold text-foreground">1-7</span> of <span className="font-semibold text-foreground">42</span></p>
           <div className="flex items-center gap-2">
             <button className="px-3 py-1.5 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-sm text-muted-foreground hover:bg-muted dark:hover:bg-accent700 disabled:opacity-50">이전</button>
             <button className="px-3 py-1.5 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-sm text-muted-foreground hover:bg-muted dark:hover:bg-accent700">다음</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
