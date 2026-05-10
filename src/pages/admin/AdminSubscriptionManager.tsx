import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, Edit2, Trash2, Check, X, 
  Settings, CreditCard, Gift, ArrowRight,
  TrendingUp, Activity, Layout, Filter,
  Save, AlertCircle, ChevronRight, MoreHorizontal,
  Calendar, Percent, DollarSign, List,
  ArrowUpDown, Hash, Layers, Ticket, ChevronDown
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface PlanConfig {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  color: string | null;
  features: { label: string; active: boolean }[];
}

interface PlanPromotion {
  id: string;
  plan_id: string | null;
  label: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

// --- Components ---

/**
 * ConfirmModal: 삭제 확인 등을 위한 공용 모달
 */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl border border-gray-100 dark:border-white/5"
      >
        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 px-4 rounded-2xl bg-gray-100 dark:bg-white/5 text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">취소</button>
          <button onClick={onConfirm} className="flex-1 py-4 px-4 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">삭제</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default function AdminSubscriptionManager() {
  const [activeTab, setActiveTab] = useState<'plans' | 'promotions'>('plans');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [promotions, setPromotions] = useState<PlanPromotion[]>([]);
  
  // Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [editingPromo, setEditingPromo] = useState<PlanPromotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'plan' | 'promo', id: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pError } = await (supabase as any).from('plan_configs').select('*').order('sort_order', { ascending: true });
      if (pError) throw pError;
      setPlans(pData || []);

      const { data: promoData, error: promoError } = await (supabase as any).from('plan_promotions').select('*').order('created_at', { ascending: false });
      if (promoError) throw promoError;
      setPromotions(promoData || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (type: 'plan' | 'promo', id: string, current: boolean) => {
    try {
      const table = type === 'plan' ? 'plan_configs' : 'plan_promotions';
      const { error } = await (supabase as any).from(table).update({ is_active: !current }).eq('id', id);
      if (error) throw error;
      toast.success('상태가 변경되었습니다.');
      fetchData();
    } catch (err) {
      toast.error('상태 변경 실패');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const table = deleteTarget.type === 'plan' ? 'plan_configs' : 'plan_promotions';
      const { error } = await (supabase as any).from(table).delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('삭제되었습니다.');
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('삭제 실패');
    }
  };

  // --- Renderers ---

  return (
    <div className="max-w-[1600px] mx-auto min-[1410px]:px-0 px-4 pb-20">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#00BFA5]/10 text-[#00BFA5] rounded-xl flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">구독 플랜 관리</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">서비스의 가격 모델과 프로모션 정책을 관리합니다.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit mb-10">
        <button 
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'plans' ? 'bg-white dark:bg-zinc-800 text-[#00BFA5] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Layout size={16} /> 플랜 관리
        </button>
        <button 
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'promotions' ? 'bg-white dark:bg-zinc-800 text-[#00BFA5] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Ticket size={16} /> 프로모션 관리
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'plans' ? (
          <motion.div 
            key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <List size={18} className="text-[#00BFA5]" /> 전체 플랜 ({plans.length})
              </h2>
              <button 
                onClick={() => { setEditingPlan(null); setIsPlanModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-[#00BFA5] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#00BFA5]/20 hover:scale-[1.02] transition-all"
              >
                <Plus size={18} /> 새 플랜 추가
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 min-[1410px]:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.id} className="bg-white dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: plan.color || '#00BFA5' }} />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black">{plan.display_name}</h3>
                        {plan.is_popular && (
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">인기</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{plan.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-[#00BFA5]">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { setDeleteTarget({ type: 'plan', id: plan.id }); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">월간</p>
                      <p className="text-lg font-black">${plan.monthly_price.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">연간</p>
                      <p className="text-lg font-black">${plan.yearly_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-500">순서: {plan.sort_order}</span>
                    </div>
                    <button 
                      onClick={() => handleToggleActive('plan', plan.id, plan.is_active)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${plan.is_active ? 'bg-[#00BFA5]/10 text-[#00BFA5]' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                    >
                      {plan.is_active ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                      {plan.is_active ? '활성' : '비활성'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Yearly Discount Management Card */}
            <YearlyDiscountCard plans={plans} onUpdate={fetchData} />
          </motion.div>
        ) : (
          <motion.div 
            key="promotions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
             <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Percent size={18} className="text-[#00BFA5]" /> 프로모션 및 할인 목록 ({promotions.length})
              </h2>
              <button 
                onClick={() => { setEditingPromo(null); setIsPromoModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-[#00BFA5] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#00BFA5]/20 hover:scale-[1.02] transition-all"
              >
                <Plus size={18} /> 새 프로모션 추가
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900/50">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/10">
                    <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">배너 라벨 / 명칭</th>
                    <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">적용 플랜</th>
                    <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">할인 내용</th>
                    <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">기간</th>
                    <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">상태</th>
                    <th className="py-6 px-8 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map(promo => {
                    const targetPlan = plans.find(p => p.id === promo.plan_id);
                    return (
                      <tr key={promo.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                        <td className="py-6 px-8">
                          <p className="text-sm font-black text-gray-900 dark:text-white">{promo.label}</p>
                        </td>
                        <td className="py-6 px-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${promo.plan_id ? 'bg-[#00BFA5]/10 text-[#00BFA5]' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                            {targetPlan ? targetPlan.display_name : '전체 플랜'}
                          </span>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-1.5 text-sm font-black">
                            <span className="text-[#00BFA5]">{promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value.toFixed(2)}`}</span>
                            <span className="text-gray-400 text-xs">OFF</span>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-gray-400">{promo.starts_at ? new Date(promo.starts_at).toLocaleDateString() : '언제나'}</span>
                            <ChevronRight size={10} className="text-gray-300" />
                            <span className="text-[10px] font-bold text-gray-400">{promo.ends_at ? new Date(promo.ends_at).toLocaleDateString() : '제한없음'}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <button 
                            onClick={() => handleToggleActive('promo', promo.id, promo.is_active)}
                            className={`w-10 h-5 rounded-full p-1 transition-colors ${promo.is_active ? 'bg-[#00BFA5]' : 'bg-gray-200 dark:bg-white/10'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${promo.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingPromo(promo); setIsPromoModalOpen(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-[#00BFA5]">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => { setDeleteTarget({ type: 'promo', id: promo.id }); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <PlanEditModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
        plan={editingPlan} 
        onSuccess={fetchData} 
      />
      <PromoEditModal 
        isOpen={isPromoModalOpen} 
        onClose={() => setIsPromoModalOpen(false)} 
        promo={editingPromo} 
        plans={plans}
        onSuccess={fetchData} 
      />
      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDelete}
        title="삭제 확인"
        message="이 작업은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?"
      />
    </div>
  );
}

// --- Internal Modals ---

const PlanEditModal = ({ isOpen, onClose, plan, onSuccess }: any) => {
  const [formData, setFormData] = useState<Partial<PlanConfig>>({
    id: '',
    name: '',
    display_name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    is_active: true,
    is_popular: false,
    sort_order: 0,
    color: '#00BFA5',
    features: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) setFormData(plan);
    else setFormData({
      id: '', name: '', display_name: '', description: '',
      monthly_price: 0, yearly_price: 0, is_active: true, is_popular: false,
      sort_order: plansLength(), color: '#00BFA5', features: []
    });
  }, [plan, isOpen]);

  const plansLength = () => 0; // Mock or actual length logic

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (plan) {
        const { error } = await (supabase as any).from('plan_configs').update(formData).eq('id', plan.id);
        if (error) throw error;
        toast.success('플랜이 수정되었습니다.');
      } else {
        const { error } = await (supabase as any).from('plan_configs').insert([formData]);
        if (error) throw error;
        toast.success('새 플랜이 추가되었습니다.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('저장 실패');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...(formData.features || []), { label: '', active: true }] });
  };

  const updateFeature = (index: number, field: string, value: any) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: (formData.features || []).filter((_, i) => i !== index) });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-end p-0 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} 
      />
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-full md:h-[calc(100vh-3rem)] md:rounded-[3rem] relative z-10 shadow-2xl flex flex-col overflow-hidden border-l border-gray-100 dark:border-white/5"
      >
        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <div>
            <h3 className="text-2xl font-black tracking-tight">{plan ? '플랜 편집' : '새 플랜 추가'}</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">구독 플랜 설정</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">내부 ID (고유값)</label>
              <input 
                required disabled={!!plan}
                type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">플랜명</label>
              <input 
                required
                type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">표시 이름</label>
            <input 
              required
              type="text" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})}
              className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">설명</label>
            <textarea 
              rows={3}
              value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">월간 가격 ($)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  required type="number" step="0.01" value={formData.monthly_price} onChange={e => setFormData({...formData, monthly_price: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">연간 가격 ($)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  required type="number" step="0.01" value={formData.yearly_price} onChange={e => setFormData({...formData, yearly_price: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">정렬 순서</label>
              <div className="relative">
                <ArrowUpDown size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  required type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">브랜드 컬러</label>
              <div className="flex gap-2">
                <input 
                  type="color" value={formData.color || '#00BFA5'} onChange={e => setFormData({...formData, color: e.target.value})}
                  className="w-14 h-14 rounded-2xl border-none cursor-pointer bg-transparent"
                />
                <input 
                  type="text" value={formData.color || ''} onChange={e => setFormData({...formData, color: e.target.value})}
                  className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-6 p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm font-black">인기 배지</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">추천 플랜으로 강조</p>
              </div>
              <button 
                type="button"
                onClick={() => setFormData({...formData, is_popular: !formData.is_popular})}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.is_popular ? 'bg-amber-500' : 'bg-gray-200 dark:bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_popular ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="w-px bg-gray-200 dark:bg-white/10" />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm font-black">활성 상태</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">서비스 노출 여부</p>
              </div>
              <button 
                type="button"
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.is_active ? 'bg-[#00BFA5]' : 'bg-gray-200 dark:bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">기능 목록</label>
              <button type="button" onClick={addFeature} className="text-[#00BFA5] text-xs font-black flex items-center gap-1 hover:underline">
                <Plus size={14} /> 항목 추가
              </button>
            </div>
            <div className="space-y-3">
              {(formData.features || []).map((feat, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1 flex gap-2 items-center bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3">
                    <button 
                      type="button"
                      onClick={() => updateFeature(idx, 'active', !feat.active)}
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${feat.active ? 'bg-[#00BFA5]/10 text-[#00BFA5]' : 'bg-gray-200 dark:bg-white/5 text-gray-400'}`}
                    >
                      {feat.active ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                    </button>
                    <input 
                      type="text" value={feat.label} onChange={e => updateFeature(idx, 'label', e.target.value)}
                      placeholder="기능 설명을 입력하세요"
                      className="flex-1 bg-transparent border-none outline-none text-sm font-bold"
                    />
                  </div>
                  <button type="button" onClick={() => removeFeature(idx)} className="p-3 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <button 
            onClick={handleSubmit} disabled={loading}
            className="w-full py-5 bg-[#00BFA5] text-white rounded-[2rem] font-black text-sm shadow-xl shadow-[#00BFA5]/20 hover:scale-[1.01] active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Activity className="animate-spin" /> : <><Save size={20} /> 설정 저장하기</>}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const PromoEditModal = ({ isOpen, onClose, promo, plans, onSuccess }: any) => {
  const [formData, setFormData] = useState<Partial<PlanPromotion>>({
    label: '',
    plan_id: null,
    discount_type: 'percentage',
    discount_value: 0,
    is_active: true,
    starts_at: null,
    ends_at: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (promo) setFormData(promo);
    else setFormData({
      label: '', plan_id: null, discount_type: 'percentage',
      discount_value: 0, is_active: true, starts_at: null, ends_at: null
    });
  }, [promo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (promo) {
        const { error } = await (supabase as any).from('plan_promotions').update(formData).eq('id', promo.id);
        if (error) throw error;
        toast.success('프로모션이 수정되었습니다.');
      } else {
        const { error } = await (supabase as any).from('plan_promotions').insert([formData]);
        if (error) throw error;
        toast.success('새 프로모션이 추가되었습니다.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('저장 실패');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-end p-0 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} 
      />
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        className="bg-white dark:bg-zinc-900 w-full max-w-xl h-full md:h-[calc(100vh-3rem)] md:rounded-[3rem] relative z-10 shadow-2xl flex flex-col overflow-hidden border-l border-gray-100 dark:border-white/5"
      >
        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <div>
            <h3 className="text-2xl font-black tracking-tight">{promo ? '프로모션 편집' : '새 프로모션 추가'}</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">프로모션 및 쿠폰 설정</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">배너 문구 (표시 메시지)</label>
            <input 
              required
              type="text" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})}
              placeholder="예: 기간 한정! 연간 구독 시 25% 할인"
              className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">적용 플랜</label>
            {(() => {
              const selectedPlan = plans.find((p: any) => p.id === formData.plan_id);
              return (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    style={{ border: '1px solid #d1d5db' }}
                    className="flex items-center justify-between gap-2 w-full px-5 py-4 text-sm bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl outline-none data-[state=open]:ring-2 data-[state=open]:ring-primary/20 hover:bg-muted transition-colors font-bold"
                  >
                    <span>{selectedPlan ? selectedPlan.display_name : '전체 플랜에 적용'}</span>
                    <ChevronDown size={14} className="opacity-50 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700/70 bg-white dark:bg-secondary z-[200]"
                  >
                    <DropdownMenuItem onClick={() => setFormData({ ...formData, plan_id: null })}>전체 플랜에 적용</DropdownMenuItem>
                    {plans.map((p: any) => (
                      <DropdownMenuItem key={p.id} onClick={() => setFormData({ ...formData, plan_id: p.id })}>
                        {p.display_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">할인 타입</label>
              <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-black/20 rounded-2xl">
                <button 
                  type="button" onClick={() => setFormData({...formData, discount_type: 'percentage'})}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${formData.discount_type === 'percentage' ? 'bg-white dark:bg-zinc-800 text-[#00BFA5] shadow-sm' : 'text-gray-500'}`}
                >
                  퍼센트 (%)
                </button>
                <button 
                  type="button" onClick={() => setFormData({...formData, discount_type: 'fixed'})}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${formData.discount_type === 'fixed' ? 'bg-white dark:bg-zinc-800 text-[#00BFA5] shadow-sm' : 'text-gray-500'}`}
                >
                  고정 금액 ($)
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">할인값</label>
              <input 
                required type="number" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: Number(e.target.value)})}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">시작일</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="date" value={formData.starts_at ? formData.starts_at.split('T')[0] : ''} onChange={e => setFormData({...formData, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null})}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">종료일</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="date" value={formData.ends_at ? formData.ends_at.split('T')[0] : ''} onChange={e => setFormData({...formData, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null})}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00BFA5] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <p className="text-sm font-black">활성 상태</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">프로모션 활성화 및 배너 노출 여부</p>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({...formData, is_active: !formData.is_active})}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.is_active ? 'bg-[#00BFA5]' : 'bg-gray-200 dark:bg-white/10'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <button 
            onClick={handleSubmit} disabled={loading}
            className="w-full py-5 bg-[#00BFA5] text-white rounded-[2rem] font-black text-sm shadow-xl shadow-[#00BFA5]/20 hover:scale-[1.01] active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Activity className="animate-spin" /> : <><Save size={20} /> 프로모션 저장하기</>}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const YearlyDiscountCard = ({ plans, onUpdate }: { plans: PlanConfig[], onUpdate: () => void }) => {
  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const handleDiscountChange = (planId: string, value: number) => {
    setDiscounts({ ...discounts, [planId]: value });
  };

  const calculateYearly = (monthly: number, discountPercent: number) => {
    const fullYear = monthly * 12;
    return Number((fullYear * (1 - discountPercent / 100)).toFixed(2));
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const updates = plans.map(plan => {
        const discount = discounts[plan.id];
        if (discount === undefined || discount === 0) return null;
        const newYearly = calculateYearly(plan.monthly_price, discount);
        return (supabase as any).from('plan_configs').update({ yearly_price: newYearly }).eq('id', plan.id);
      }).filter(Boolean);

      if (updates.length === 0) {
        toast.info('변경사항이 없습니다.');
        return;
      }

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;

      toast.success('연간 할인 가격이 일괄 업데이트되었습니다.');
      onUpdate();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('업데이트 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00BFA5]/5 blur-[100px] rounded-full -mr-32 -mt-32" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
            <Percent size={24} className="text-[#00BFA5]" /> 연간 할인 설정
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">월간 가격 대비 연간 구독 할인율을 일괄 조정합니다.</p>
        </div>
        <button 
          onClick={handleSaveAll} disabled={loading}
          className="px-8 py-4 bg-[#00BFA5] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#00BFA5]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          {loading ? <Activity className="animate-spin" /> : <><Save size={18} /> 일괄 저장</>}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 min-[1410px]:grid-cols-4 gap-4 mt-8 relative z-10">
        {plans.map(plan => (
          <div key={plan.id} className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-2xl p-5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{plan.display_name}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">할인율 (%)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={discounts[plan.id] ?? ''}
                  onChange={e => handleDiscountChange(plan.id, Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00BFA5]"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">예상 연간 가격</label>
                <div className="py-2 px-1 text-sm font-black text-[#00BFA5]">
                  ${calculateYearly(plan.monthly_price, discounts[plan.id] || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
