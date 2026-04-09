import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Calendar, Loader2, List, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import dayjs from 'dayjs';

interface SpendHistory {
  id: string;
  campaign_name: string;
  spend_amount: number;
  note: string;
  recorded_at: string;
}

interface MarketingSpendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MarketingSpendModal: React.FC<MarketingSpendModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [history, setHistory] = useState<SpendHistory[]>([]);
  const [totalSpendStr, setTotalSpendStr] = useState('0');
  
  const [formData, setFormData] = useState({
    campaign_name: '',
    spend_amount: '',
    note: ''
  });

  // 오픈될 때 히스토리 불러오기
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('marketing_spends')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
           toast.error('DB 스키마가 아직 적용되지 않았습니다. SQL을 실행하셨나요?');
        }
        throw error;
      }
      
      setHistory(data || []);
      const total = (data || []).reduce((acc: number, cur: SpendHistory) => acc + Number(cur.spend_amount), 0);
      setTotalSpendStr(total.toLocaleString());
    } catch (err: any) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm('기록을 삭제할까요? (CAC, ROAS 통계에서 즉시 차감됩니다)')) return;
    
    try {
      const { error } = await supabase.from('marketing_spends').delete().eq('id', id);
      if (error) throw error;
      toast.success('제거되었습니다.');
      fetchHistory();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('삭제 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.campaign_name || !formData.spend_amount) {
      toast.error('캠페인명과 예산 금액을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('marketing_spends').insert([{
        campaign_name: formData.campaign_name,
        spend_amount: Number(formData.spend_amount),
        note: formData.note,
        recorded_by: userData.user?.id
      }]);

      if (error) throw error;

      toast.success('마케팅 지출 내역이 안전하게 기록되었습니다.');
      setFormData({ campaign_name: '', spend_amount: '', note: '' });
      fetchHistory();
      setActiveTab('history');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('지출 내역 기록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><DollarSign size={20} /></div>
                마케팅 비용 관리
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                기록된 예산은 CAC 및 ROAS 계산에 반영됩니다.
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="flex bg-gray-50 dark:bg-gray-800/30 p-1 mx-6 mt-4 rounded-xl border border-gray-100 dark:border-gray-700/50 flex-shrink-0">
             <button
               onClick={() => setActiveTab('input')}
               className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'input' ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
             >예산 기입</button>
             <button
               onClick={() => setActiveTab('history')}
               className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
             >집행 내역</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'input' ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleSubmit} 
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold mb-2">캠페인 이름</label>
                    <input 
                      type="text" 
                      placeholder="예: 봄맞이 인스타그램 광고" 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      value={formData.campaign_name}
                      onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">총 집행 금액 (원)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₩</span>
                      <input 
                        type="number" 
                        placeholder="500000" 
                        className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        value={formData.spend_amount}
                        onChange={(e) => setFormData({...formData, spend_amount: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">비고 (선택)</label>
                    <textarea 
                      placeholder="캠페인에 대한 메모나 목표를 기록하세요." 
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                      value={formData.note}
                      onChange={(e) => setFormData({...formData, note: e.target.value})}
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
                      {loading ? '기록 중...' : '기록 추가'}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="px-6 py-5 min-h-[400px]"
                >
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-sm font-bold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <List size={14} /> 기록 리스트
                    </h3>
                    <span className="text-xs font-black text-purple-600 flex items-center gap-1">누적 총액: ₩{totalSpendStr}</span>
                  </div>
                  
                  {fetching ? (
                     <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                  ) : history.length === 0 ? (
                     <div className="text-center text-xs text-gray-400 py-6">기록된 비용 내역이 없습니다.</div>
                  ) : (
                     <div className="space-y-2 pb-4">
                        {history.map((record) => (
                          <div key={record.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl flex items-center justify-between group">
                             <div>
                               <div className="text-sm font-bold truncate pr-2 max-w-[200px]">{record.campaign_name}</div>
                               <div className="text-[10px] text-gray-500 mt-0.5">{dayjs(record.recorded_at).format('YYYY-MM-DD HH:mm')}</div>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                               <span className="font-black text-sm text-purple-600">₩{record.spend_amount.toLocaleString()}</span>
                               <button 
                                  type="button"
                                  onClick={(e) => handleDelete(record.id, e)}
                                  className="text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                               >
                                  <Trash2 size={12} className="inline mr-0.5" />지우기
                               </button>
                             </div>
                          </div>
                        ))}
                     </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MarketingSpendModal;
