import React, { useState } from 'react';
import { Search, Edit, Trash2, Eye, EyeOff, ChevronDown, Calendar, Package, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { goodsService } from '@/services/goodsService';
import type { Product } from '@/services/goodsService';

const AdminGoodsManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [goods, setGoods] = useState<any[]>([]);

  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchGoods = async () => {
    setLoading(true);
    try {
      const data = await goodsService.fetchProducts({
        searchTerm,
        status: filterStatus,
        category: categoryFilter
      });
      setGoods(data);
    } catch (err: any) {
      console.error('Fetch goods error:', err);
      toast.error('상품 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGoods();
  }, [searchTerm, filterStatus, categoryFilter]);

  const handleToggleHide = async (id: string, currentHidden: boolean) => {
    try {
      await goodsService.updateProductFields(id, { is_hidden: !currentHidden });
      setGoods(goods.map(p => p.id === id ? { ...p, is_hidden: !currentHidden } : p));
      toast.success(!currentHidden ? '상품이 숨김 처리되었습니다.' : '상품 숨김이 해제되었습니다.');
    } catch (err: any) {
      toast.error('상태 변경 실패');
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/goods/edit/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedProduct(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', selectedProduct);
      if (error) throw error;
      setGoods(goods.filter(p => p.id !== selectedProduct));
      toast.success(t('admin.goods_deleted'));
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      toast.error('삭제 실패');
    }
  };

  const getStatusBadge = (status: string, stock: number) => {
    if (status === 'draft') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[10px] font-black text-gray-400 uppercase tracking-wider">
           <div className="w-1 h-1 rounded-full bg-gray-400" />
           작성 중
        </div>
      );
    }
    if (stock === 0) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-[10px] font-black text-red-500 uppercase tracking-wider">
           <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
           일시 품절
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-wider">
         <div className="w-1.5 h-1.5 rounded-full bg-primary" />
         정상 판매
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-12 space-y-8">
        
        {/* Header with Premium Feel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">상품 목록 관리</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">스토어에 등록된 모든 상품의 생명주기를 관리합니다</p>
          </div>
          <button
            onClick={() => navigate('/admin/goods/new')}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group"
          >
            <Package size={20} className="group-hover:rotate-12 transition-transform" />
            새로운 상품 등록
          </button>
        </div>

        {/* Global Search and Filter Canvas */}
        <div className="p-6 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="찾으시는 상품의 이름을 입력하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 h-14 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-white/5 focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-4">
               <div className="relative min-w-[160px]">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full h-14 pl-6 pr-12 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-white/5 outline-none font-bold text-xs appearance-none cursor-pointer"
                  >
                    <option value="all">모든 판매 상태</option>
                    <option value="active">현재 판매중</option>
                    <option value="soldout">완판/품절</option>
                    <option value="draft">임시 저정본</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
               </div>

               <div className="relative min-w-[160px]">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full h-14 pl-6 pr-12 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-white/5 outline-none font-bold text-xs appearance-none cursor-pointer"
                  >
                    <option value="all">전체 카테고리</option>
                    <option value="clothing">인기 의류</option>
                    <option value="accessories">액세서리</option>
                    <option value="stationery">프리미엄 문구</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
               </div>
            </div>
          </div>
        </div>

        {/* Goods Inventory Table Area */}
        <div className="rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-2xl shadow-black/5 border border-white/20 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed min-w-[1000px]">
              <thead className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-white/5">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-10 py-6 w-[350px]">상품 상세 정보</th>
                  <th className="px-6 py-6 text-center w-[140px]">카테고리</th>
                  <th className="px-6 py-6 text-right w-[120px]">판매가 ($)</th>
                  <th className="px-6 py-6 text-center w-[120px]">현재 재고</th>
                  <th className="px-6 py-6 text-center w-[130px]">판매 상태</th>
                  <th className="px-6 py-6 text-center w-[100px]">숨김 처리</th>
                  <th className="px-10 py-6 text-right w-[140px]">관리 메뉴</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                   <tr>
                     <td colSpan={7} className="py-32 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-widest">데이터 동기화 중...</p>
                     </td>
                   </tr>
                ) : goods.length === 0 ? (
                   <tr>
                     <td colSpan={7} className="py-32 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                           <Package size={40} className="text-gray-300" />
                        </div>
                        <p className="text-lg font-black text-gray-900 dark:text-white">등록된 상품이 없습니다</p>
                        <p className="text-sm text-gray-500 mt-2">새로운 컬렉션을 추가하여 스토어를 채워보세요</p>
                     </td>
                   </tr>
                ) : (
                  goods.map((product) => (
                    <tr key={product.id} className="group hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-all duration-300">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm group-hover:scale-105 transition-transform duration-500">
                             {product.main_image_url ? (
                                 <img src={product.main_image_url} className="w-full h-full object-cover" alt="" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center opacity-20">
                                   <Package size={32} />
                                 </div>
                             )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-black text-gray-900 dark:text-white leading-tight line-clamp-2 break-all">{product.name}</div>
                            <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                               <Calendar size={12} />
                               {product.created_at ? format(new Date(product.created_at), 'yyyy-MM-dd') : '-'} 등록
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center">
                        <span className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest">
                          {product.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-8 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className={`text-sm font-black ${product.discount_percent > 0 ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                            ${(product.sale_price > 0 ? product.sale_price : product.price).toFixed(2)}
                          </span>
                          {product.discount_percent > 0 && (
                            <span className="text-[10px] text-gray-400 line-through">${product.price.toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center text-sm">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-800/50">
                          <span className={`font-black ${product.stock === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                            {product.stock?.toLocaleString() || 0}
                          </span>
                          <span className="text-[10px] font-black text-gray-400">PCS</span>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center">
                        {getStatusBadge(product.status, product.stock)}
                      </td>
                      <td className="px-6 py-8 text-center">
                        <button
                          onClick={() => handleToggleHide(product.id, product.is_hidden)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                            product.is_hidden ? 'bg-orange-500 shadow-lg shadow-orange-500/30' : 'bg-gray-200 dark:bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                              product.is_hidden ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="p-3 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:border-primary/30 rounded-2xl transition-all shadow-sm active:scale-90"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="p-3 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500/30 rounded-2xl transition-all shadow-sm active:scale-90"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination and Summary Footer */}
          <div className="px-10 py-8 bg-gray-50/50 dark:bg-zinc-800/30 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 rounded-full bg-primary" />
               <span className="text-xs font-black text-gray-500 uppercase tracking-widest">전체 보유 수량: {goods.length}개</span>
            </div>
            
            <div className="flex gap-2">
              <PageButton icon={ChevronDown} rotate={90} disabled />
              <PageButton label="1" active />
              <PageButton label="2" />
              <PageButton icon={ChevronDown} rotate={-90} />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Soft Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-red-500">
               <Trash2 size={32} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">정말 폐기할까요?</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                이 마스터 데이터를 삭제하면 복구가 불가능하며 모든 채널에서 즉시 제거됩니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setDeleteModalOpen(false); setSelectedProduct(null); }}
                className="px-6 py-5 rounded-2xl font-bold text-sm text-gray-500 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 transition-all active:scale-95"
              >
                잠깐, 유지하기
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-6 py-5 rounded-2xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95"
              >
                확실히 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Atomic Components
const PageButton = ({ label, icon: Icon, active, disabled, rotate }: { label?: string, icon?: any, active?: boolean, disabled?: boolean, rotate?: number }) => (
  <button 
    disabled={disabled}
    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all font-black text-xs border ${
      active 
        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
        : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-white/5 text-gray-400 hover:border-gray-200 dark:hover:border-zinc-700'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
  >
    {Icon ? <Icon size={16} style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }} /> : label}
  </button>
);

export default AdminGoodsManagement;
