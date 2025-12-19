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
// Since we don't have a shared layout yet, I'll implement a clean page structure 
// that can be wrapped by the AdminHome sidebar logic or a new AdminLayout later.
// For now, this component assumes it's rendered inside the "Main Content" area of an admin layout.

const UserManagement = () => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Ensure this data is diverse and looks realistic
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
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Banned': return 'bg-red-50 text-red-600 border-red-100';
      case 'Inactive': return 'bg-slate-50 text-slate-500 border-slate-100';
      case 'Reported': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'text-violet-600 bg-violet-50 border-violet-100';
      case 'Editor': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">사용자 관리</h1>
          <p className="text-slate-500 mt-1">총 <span className="font-semibold text-slate-900">{users.length}</span>명의 사용자가 등록되어 있습니다.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm">
            <Download size={16} />
            내보내기
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 font-medium text-sm">
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
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${stat.color}-50 text-${stat.color}-600`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mt-2">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Filters Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="이름, 이메일로 검색..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
             <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <Filter size={16} className="text-slate-500" />
                <span className="text-sm text-slate-600 font-medium">필터:</span>
                <select 
                  className="bg-transparent border-none text-sm text-slate-800 font-medium focus:ring-0 cursor-pointer"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="All">모든 권한</option>
                  <option value="Admin">관리자</option>
                  <option value="Editor">에디터</option>
                  <option value="User">사용자</option>
                </select>
             </div>
             
             <div className="h-8 w-px bg-slate-200 hidden lg:block" />
             
             <div className="flex gap-2">
               {['Active', 'Banned'].map(status => (
                 <button 
                  key={status}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    filterStatus === status 
                      ? 'bg-slate-800 text-white border-slate-800' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30" />
                </th>
                <th className="px-6 py-4">사용자 정보</th>
                <th className="px-6 py-4">권한</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4">위치</th>
                <th className="px-6 py-4">가입일</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
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
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={14} className="text-slate-400" />
                      {user.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar size={14} className="text-slate-400" />
                      {user.joined}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Visual) */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
           <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-900">1-7</span> of <span className="font-semibold text-slate-900">42</span></p>
           <div className="flex items-center gap-2">
             <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">이전</button>
             <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">다음</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
