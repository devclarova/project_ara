import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Edit2, Plus, Trash2, Ticket, Play, Square, Loader2, Copy } from 'lucide-react';
import Modal from '../../components/common/Modal';

// Types
interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  target_type: 'all' | 'new_user' | 'subscriber';
  applicable_products: string[] | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

interface Coupon {
  id: string;
  promotion_id: string;
  code: string;
  usage_limit: number;
  used_count: number;
  per_user_limit: number;
  is_active: boolean;
}

// Components
const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [promoForm, setPromoForm] = useState<Partial<Promotion>>({
    title: '',
    description: '',
    discount_type: 'percent',
    discount_value: 0,
    min_order_amount: 0,
    max_discount: null,
    target_type: 'all',
    is_active: true,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // +30 days
  });

  const [selectedPromoForCoupons, setSelectedPromoForCoupons] = useState<Promotion | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    codePrefix: '',
    count: 1,
    usageLimit: 1,
    perUserLimit: 1,
  });

  // --- Promotions CRUD ---

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('프로모션 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleSavePromo = async () => {
    if (!promoForm.title || !promoForm.discount_value || !promoForm.starts_at || !promoForm.ends_at) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      const payload = {
        title: promoForm.title,
        description: promoForm.description,
        discount_type: promoForm.discount_type,
        discount_value: parseFloat(promoForm.discount_value.toString()),
        min_order_amount: parseFloat((promoForm.min_order_amount || 0).toString()),
        max_discount: promoForm.max_discount ? parseFloat(promoForm.max_discount.toString()) : null,
        target_type: promoForm.target_type,
        starts_at: new Date(promoForm.starts_at).toISOString(),
        ends_at: new Date(promoForm.ends_at).toISOString(),
        is_active: promoForm.is_active,
      };

      if (editingPromo) {
        const { error } = await supabase
          .from('promotions')
          .update(payload)
          .eq('id', editingPromo.id);
        if (error) throw error;
        toast.success('프로모션이 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([payload]);
        if (error) throw error;
        toast.success('새 프로모션이 생성되었습니다.');
      }
      setIsPromoModalOpen(false);
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('저장에 실패했습니다.');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('정말 이 프로모션과 관련 쿠폰을 모두 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
      toast.success('삭제되었습니다.');
      fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const togglePromoStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(`상태가 ${!currentStatus ? '활성화' : '비활성화'} 되었습니다.`);
      fetchPromotions();
    } catch (error) {
      console.error('Error toggling promo status:', error);
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const openNewPromoModal = () => {
    setEditingPromo(null);
    setPromoForm({
      title: '',
      description: '',
      discount_type: 'percent',
      discount_value: 0,
      min_order_amount: 0,
      max_discount: null,
      target_type: 'all',
      is_active: true,
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    });
    setIsPromoModalOpen(true);
  };

  const openEditPromoModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setPromoForm({
      ...promo,
      starts_at: new Date(promo.starts_at).toISOString().slice(0, 16),
      ends_at: new Date(promo.ends_at).toISOString().slice(0, 16),
    });
    setIsPromoModalOpen(true);
  };

  // --- Coupons CRUD ---

  const handleManageCoupons = async (promo: Promotion) => {
    setSelectedPromoForCoupons(promo);
    fetchCoupons(promo.id);
  };

  const fetchCoupons = async (promoId: string) => {
    setLoadingCoupons(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('promotion_id', promoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Fetch coupons error:', error);
      toast.error('쿠폰 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const generateRandomCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const handleGenerateCoupons = async () => {
    if (!selectedPromoForCoupons) return;
    if (couponForm.count < 1 || couponForm.count > 1000) {
      toast.error('한 번에 1개에서 1000개까지만 생성할 수 있습니다.');
      return;
    }

    try {
      const newCoupons = Array.from({ length: couponForm.count }, () => ({
        promotion_id: selectedPromoForCoupons.id,
        code: `${couponForm.codePrefix.toUpperCase()}${couponForm.codePrefix ? '-' : ''}${couponForm.count > 1 ? generateRandomCode(6) : couponForm.codePrefix ? '' : generateRandomCode(8)}`,
        usage_limit: couponForm.usageLimit,
        per_user_limit: couponForm.perUserLimit,
        is_active: true
      }));

      // if count is 1 and prefix is provided but no random generated, just use prefix.
      if (couponForm.count === 1 && couponForm.codePrefix) {
        newCoupons[0].code = couponForm.codePrefix.toUpperCase();
      }

      const { error } = await supabase.from('coupons').insert(newCoupons);
      if (error) {
          if (error.code === '23505') {
            throw new Error('중복된 쿠폰 코드가 존재합니다.');
          }
          throw error;
      }
      
      toast.success(`${couponForm.count}개의 쿠폰이 생성되었습니다.`);
      setIsCouponModalOpen(false);
      fetchCoupons(selectedPromoForCoupons.id);
    } catch (error: any) {
      console.error('Error generating coupons:', error);
      toast.error(error.message || '쿠폰 생성에 실패했습니다.');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('정말 이 쿠폰을 취소하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('쿠폰이 삭제되었습니다.');
    } catch (error) {
      console.error('Delete coupon error:', error);
      toast.error('쿠폰 삭제에 실패했습니다.');
    }
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    try {
        const { error } = await supabase
          .from('coupons')
          .update({ is_active: !currentStatus })
          .eq('id', id);
        if (error) throw error;
        toast.success(`상태가 변경되었습니다.`);
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('상태 변경에 실패했습니다.');
      }
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">프로모션 및 쿠폰 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">할인 캠페인을 기획하고 쿠폰 코드를 발급하세요.</p>
        </div>
        <button
          onClick={openNewPromoModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
        >
          <Plus size={16} />
          새 프로모션 생성
        </button>
      </div>

      {!selectedPromoForCoupons ? (
          /* PROMOTIONS LIST */
          <div className="bg-background rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : promotions.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>등록된 프로모션이 없습니다.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">캠페인 정보</th>
                      <th className="px-6 py-4 font-medium">할인 혜택</th>
                      <th className="px-6 py-4 font-medium">기간</th>
                      <th className="px-6 py-4 font-medium">상태</th>
                      <th className="px-6 py-4 font-medium text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {promotions.map((promo) => (
                      <tr key={promo.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{promo.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                            {promo.target_type === 'all' ? '전체 사용자' : promo.target_type === 'new_user' ? '신규 가입자' : '유료 구독자'} 대상
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">
                            {promo.discount_type === 'percent' ? `${promo.discount_value}%` : `₩${promo.discount_value.toLocaleString()}`}
                          </span>
                          {promo.min_order_amount > 0 && (
                              <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">최소 ₩{promo.min_order_amount.toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                           <div><span className="text-muted-foreground">시작:</span> {new Date(promo.starts_at).toLocaleDateString()}</div>
                           <div><span className="text-muted-foreground">종료:</span> {new Date(promo.ends_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            promo.is_active 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {promo.is_active ? '활성' : '종료됨'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                           <button
                            onClick={() => handleManageCoupons(promo)}
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="쿠폰 관리"
                          >
                            <Ticket size={18} />
                          </button>
                          <button
                            onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                            className="p-1.5 text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors"
                            title={promo.is_active ? "비활성화" : "활성화"}
                          >
                            {promo.is_active ? <Square size={18} /> : <Play size={18} />}
                          </button>
                          <button
                            onClick={() => openEditPromoModal(promo)}
                            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                            title="캠페인 수정"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promo.id)}
                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
      ) : (
          /* COUPONS VIEW */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-secondary/30 p-4 rounded-xl border border-border flex items-center justify-between">
                <div>
                   <button 
                     onClick={() => setSelectedPromoForCoupons(null)}
                     className="text-sm font-medium text-primary hover:underline mb-1 inline-flex items-center gap-1"
                    >
                        ← 돌아가기
                    </button>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-primary" />
                        {selectedPromoForCoupons.title} <span className="text-muted-foreground font-normal text-base">- 발급된 쿠폰 목록</span>
                    </h2>
                </div>
                <button
                    onClick={() => {
                        setCouponForm({ codePrefix: '', count: 1, usageLimit: 0, perUserLimit: 1 });
                        setIsCouponModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus size={16} /> 쿠폰 발급
                </button>
             </div>

             <div className="bg-background rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loadingCoupons ? (
                        <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
                    ) : coupons.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">이 캠페인을 위해 발급된 쿠폰이 없습니다.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-3 font-medium">코드</th>
                                    <th className="px-6 py-3 font-medium">사용 횟수/한도</th>
                                    <th className="px-6 py-3 font-medium">인당 제한</th>
                                    <th className="px-6 py-3 font-medium">상태</th>
                                    <th className="px-6 py-3 font-medium text-right">삭제</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-3 font-mono font-medium text-primary flex items-center gap-2">
                                            {coupon.code}
                                            <button onClick={() => {
                                                navigator.clipboard.writeText(coupon.code);
                                                toast.success('복사되었습니다.');
                                            }} className="text-muted-foreground hover:text-foreground">
                                                <Copy size={14} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-3">
                                            {coupon.used_count} / {coupon.usage_limit > 0 ? coupon.usage_limit : '무제한'}
                                        </td>
                                        <td className="px-6 py-3">
                                            {coupon.per_user_limit}회
                                        </td>
                                        <td className="px-6 py-3">
                                            <button 
                                                onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                                                className={`text-xs px-2 py-0.5 rounded-full ${coupon.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}
                                            >
                                                {coupon.is_active ? '활성' : '비활성'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
             </div>
          </div>
      )}

      {/* Promotion Status Modal */}
      <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} closeOnBackdrop={false} title={editingPromo ? '프로모션 수정' : '새 프로모션 생성'} className="max-w-2xl max-h-[90vh] overflow-y-auto w-full">
        <div className="space-y-4 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">캠페인 제목 🔴</label>
                    <input type="text" value={promoForm.title || ''} onChange={e => setPromoForm({...promoForm, title: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="예: 봄맞이 전상품 20% 할인" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">상세 설명</label>
                    <textarea value={promoForm.description || ''} onChange={e => setPromoForm({...promoForm, description: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[80px]" placeholder="이용 약관이나 세부 조건을 입력하세요." />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">할인 방식</label>
                    <select value={promoForm.discount_type} onChange={e => setPromoForm({...promoForm, discount_type: e.target.value as any})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                        <option value="percent">퍼센트 할인 (%)</option>
                        <option value="fixed">고정 금액 할인 (₩)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">할인 수치 🔴</label>
                    <input type="number" value={promoForm.discount_value || ''} onChange={e => setPromoForm({...promoForm, discount_value: parseFloat(e.target.value)})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder={promoForm.discount_type === 'percent' ? "예: 20" : "예: 5000"} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">최소 주문/결제 금액</label>
                    <input type="number" value={promoForm.min_order_amount || 0} onChange={e => setPromoForm({...promoForm, min_order_amount: parseFloat(e.target.value)})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="0이면 제한 없음" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">지원 대상</label>
                    <select value={promoForm.target_type} onChange={e => setPromoForm({...promoForm, target_type: e.target.value as any})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                        <option value="all">모든 사용자</option>
                        <option value="new_user">신규 가입자 (첫주문)</option>
                        <option value="subscriber">프리미엄 구독자 전용</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">시작일자 🔴</label>
                    <input type="datetime-local" value={promoForm.starts_at || ''} onChange={e => setPromoForm({...promoForm, starts_at: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">종료일자 🔴</label>
                    <input type="datetime-local" value={promoForm.ends_at || ''} onChange={e => setPromoForm({...promoForm, ends_at: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setIsPromoModalOpen(false)} className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-muted rounded-lg text-sm font-medium transition-colors">취소</button>
                <button onClick={handleSavePromo} className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors">
                    {editingPromo ? '수정 완료' : '프로모션 생성'}
                </button>
            </div>
        </div>
      </Modal>

      {/* Coupon Generate Modal */}
      <Modal isOpen={isCouponModalOpen} onClose={() => setIsCouponModalOpen(false)} closeOnBackdrop={false} title="쿠폰 코드 발급" className="max-w-md w-full">
        <div className="space-y-4 p-1">
            <p className="text-sm text-muted-foreground mb-4 font-medium">[{selectedPromoForCoupons?.title}] 전용 쿠폰을 발급합니다.</p>
            
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">쿠폰 발급 개수</label>
                <input type="number" min="1" max="1000" value={couponForm.count} onChange={e => setCouponForm({...couponForm, count: parseInt(e.target.value)})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                <p className="text-xs text-muted-foreground mt-1">1회 최대 1000장까지 대량 발급 가능</p>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">접두어 (선택 사항)</label>
                <input type="text" value={couponForm.codePrefix} onChange={e => setCouponForm({...couponForm, codePrefix: e.target.value.toUpperCase()})} placeholder="예: SPRING" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono" />
                <p className="text-xs text-muted-foreground mt-1">발급 개수가 1개일 경우, 이 접두어가 그대로 코드가 됩니다. (랜덤 난수 붙지 않음)</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-1">총 사용 가능 횟수 (쿠폰별 한도)</label>
                <input type="number" value={couponForm.usageLimit} onChange={e => setCouponForm({...couponForm, usageLimit: parseInt(e.target.value)})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                <p className="text-xs text-muted-foreground mt-1">0이면 횟수 제한 없음 (퍼블릭 쿠폰용)</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-1">1인당 사용 제한</label>
                <input type="number" value={couponForm.perUserLimit} onChange={e => setCouponForm({...couponForm, perUserLimit: parseInt(e.target.value)})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>

            <div className="flex justify-end gap-2 mt-6 bg-secondary/20 p-4 -mx-4 -mb-4 border-t border-border border-opacity-50">
                <button onClick={() => setIsCouponModalOpen(false)} className="px-4 py-2 bg-background border border-border text-foreground hover:bg-muted rounded-lg text-sm font-medium transition-colors">취소</button>
                <button onClick={handleGenerateCoupons} className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Ticket size={16} /> 발급하기
                </button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default AdminPromotionsPage;
