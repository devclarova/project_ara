import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Image as ImageIcon,
  CheckCircle2,
  Package,
  DollarSign,
  Tag,
  Layers,
  Truck,
  Move,
  Type,
  Video
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface ProductOption {
  id: string;
  name: string; // e.g. "Color", "Size"
  values: string[]; // e.g. ["Red", "Blue"]
}

interface ProductVariant {
  id: string;
  options: Record<string, string>; // { "Color": "Red", "Size": "M" }
  stock: number;
  additionalPrice: number;
}

const AdminGoodsUpload = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'detail' | 'options'>('basic');
  
  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    categoryId: '',
    price: 0,
    salePrice: 0,
    status: 'draft', // draft, active, soldout
    summary: '',
    badge_new: false,
    badge_best: false,
    badge_sale: false,
    shippingFee: 0,
    freeShippingThreshold: 50,
  });

  // Images State
  const [mainImage, setMainImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Description State
  const [description, setDescription] = useState<string>(''); // For rich text editor (mock)

  // Options State
  const [useOptions, setUseOptions] = useState(false);
  const [optionGroups, setOptionGroups] = useState<ProductOption[]>([
    { id: 'opt-1', name: 'Color', values: [] },
    { id: 'opt-2', name: 'Size', values: [] }
  ]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Handlers
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Checkbox handling hack if needed, but usually controlled separately
    setBasicInfo(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setBasicInfo(prev => ({ ...prev, [name]: checked }));
  };

  const addOptionValue = (groupIndex: number, value: string) => {
    if (!value) return;
    const newGroups = [...optionGroups];
    if (!newGroups[groupIndex].values.includes(value)) {
      newGroups[groupIndex].values.push(value);
      setOptionGroups(newGroups);
      generateVariants(newGroups);
    }
  };

  const removeOptionValue = (groupIndex: number, value: string) => {
    const newGroups = [...optionGroups];
    newGroups[groupIndex].values = newGroups[groupIndex].values.filter(v => v !== value);
    setOptionGroups(newGroups);
    generateVariants(newGroups);
  };

  // Mock variant generation
  const generateVariants = (groups: ProductOption[]) => {
    // Cartesian product logic simplified for demo
    // If only 1 group has values, just map them
    // This is a UI mock, so just making a simple flat list for now if complex
    // Let's implement simple combination for 2 levels max
    const group1 = groups[0].values;
    const group2 = groups[1].values;
    
    let newVariants: ProductVariant[] = [];
    
    if (group1.length > 0 && group2.length > 0) {
      group1.forEach(v1 => {
        group2.forEach(v2 => {
          newVariants.push({
            id: `${v1}-${v2}`,
            options: { [groups[0].name]: v1, [groups[1].name]: v2 },
            stock: 10,
            additionalPrice: 0
          });
        });
      });
    } else if (group1.length > 0) {
      group1.forEach(v1 => {
        newVariants.push({
          id: v1,
          options: { [groups[0].name]: v1 },
          stock: 10,
          additionalPrice: 0
        });
      });
    } else if (group2.length > 0) {
      group2.forEach(v2 => {
         newVariants.push({
          id: v2,
          options: { [groups[1].name]: v2 },
          stock: 10,
          additionalPrice: 0
        });
      }); 
    }
    
    setVariants(newVariants);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ basicInfo, mainImage, galleryImages, description, variants });
    toast.success('상품이 성공적으로 등록되었습니다!');
  };

  // UI Components
  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
        activeTab === id 
          ? 'border-emerald-500 text-emerald-600' 
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">상품 등록</h1>
          <p className="text-slate-500">굿즈샵에 새로운 상품을 등록합니다.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            onClick={() => window.history.back()}
          >
            취소
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-200 transition-colors"
          >
            <Save size={18} />
            저장하기
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          <TabButton id="basic" label="기본 정보" icon={Package} />
          <TabButton id="detail" label="상세 정보" icon={Type} />
          <TabButton id="options" label="옵션 및 재고" icon={Layers} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">

          {/* ----- STEP 1: BASIC INFO ----- */}
          <div className={activeTab === 'basic' ? 'block space-y-8' : 'hidden'}>
            
            {/* Status & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="field">
                <label className="label font-semibold text-slate-700">판매 상태</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                   {(['draft', 'active', 'soldout'] as const).map(status => (
                     <button
                        key={status}
                        type="button"
                        onClick={() => setBasicInfo(prev => ({...prev, status}))}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          basicInfo.status === status 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                     >
                       {status === 'draft' ? '작성 중' : status === 'active' ? '판매 중' : '품절'}
                     </button>
                   ))}
                </div>
              </div>
              
              <div className="field">
                <label className="label font-semibold text-slate-700">카테고리</label>
                <div className="flex gap-2">
                  <select 
                    name="categoryId" 
                    value={basicInfo.categoryId}
                    onChange={handleBasicChange}
                    className="input flex-1"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="clothing">의류</option>
                    <option value="accessories">액세서리</option>
                    <option value="stationery">문구</option>
                    <option value="digital">디지털</option>
                  </select>
                  <button type="button" className="btn btn-outline px-3" title="카테고리 추가">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Name */}
             <div className="field">
              <label className="label font-semibold text-slate-700">상품명 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="name"
                value={basicInfo.name}
                onChange={handleBasicChange}
                className="input text-lg" 
                placeholder="상품명을 입력하세요" 
                required 
              />
            </div>

            {/* Price & Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="field">
                 <label className="label font-semibold text-slate-700">판매가 ($)</label>
                 <div className="relative">
                   <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                   <input 
                    type="number" 
                    name="price"
                    value={basicInfo.price}
                    onChange={handleBasicChange}
                    className="input pl-9" 
                    min="0"
                    step="0.01"
                   />
                 </div>
              </div>
              <div className="field">
                 <label className="label font-semibold text-slate-700">할인가 ($) <span className="text-slate-400 font-normal text-xs">(0이면 미적용)</span></label>
                 <div className="relative">
                   <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                   <input 
                    type="number" 
                    name="salePrice"
                    value={basicInfo.salePrice}
                    onChange={handleBasicChange}
                    className="input pl-9" 
                    min="0"
                    step="0.01"
                   />
                 </div>
              </div>
              <div className="field">
                 <label className="label font-semibold text-slate-700">배송비 ($)</label>
                 <div className="relative">
                   <Truck size={16} className="absolute left-3 top-3 text-slate-400" />
                   <input 
                    type="number" 
                    name="shippingFee"
                    value={basicInfo.shippingFee}
                    onChange={handleBasicChange}
                    className="input pl-9" 
                    min="0"
                    step="0.01"
                   />
                 </div>
              </div>
            </div>
            
             {/* Summary */}
             <div className="field">
               <label className="label font-semibold text-slate-700">간략 소개</label>
               <textarea 
                  name="summary"
                  value={basicInfo.summary}
                  onChange={handleBasicChange}
                  className="textarea h-24"
                  placeholder="목록에 표시될 짧은 소개글입니다."
               />
             </div>

             {/* Images - Mock Upload */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <label className="label font-semibold text-slate-700">대표 이미지</label>
                 <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors cursor-pointer">
                    {mainImage ? (
                      <img src={mainImage} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">이미지 업로드</span>
                      </>
                    )}
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="label font-semibold text-slate-700">추가 갤러리 이미지</label>
                 <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="aspect-square bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-100 cursor-pointer">
                        <Plus size={24} />
                      </div>
                    ))}
                 </div>
                 <p className="text-xs text-slate-400">* 최대 10장까지 등록 가능</p>
               </div>
             </div>

             {/* Badges */}
             <div className="pt-4 border-t border-slate-100">
               <label className="label font-semibold text-slate-700 mb-4 block">상품 뱃지 설정</label>
               <div className="flex flex-wrap gap-4">
                 <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                   <input type="checkbox" checked={basicInfo.badge_new} onChange={(e) => handleCheckboxChange('badge_new', e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
                   <span className="font-medium text-slate-700">New (신상품)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                   <input type="checkbox" checked={basicInfo.badge_best} onChange={(e) => handleCheckboxChange('badge_best', e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
                   <span className="font-medium text-slate-700">Best (인기)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                   <input type="checkbox" checked={basicInfo.badge_sale} onChange={(e) => handleCheckboxChange('badge_sale', e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
                   <span className="font-medium text-slate-700">Sale (세일)</span>
                 </label>
               </div>
             </div>

             <div className="flex justify-end pt-4">
                <button type="button" onClick={() => setActiveTab('detail')} className="btn btn-primary">다음: 상세 정보</button>
             </div>
          </div>

          {/* ----- STEP 2: DETAIL (RICH TEXT) ----- */}
          <div className={activeTab === 'detail' ? 'block space-y-6' : 'hidden'}>
             <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden min-h-[500px] flex flex-col">
                {/* Toolbar Mock */}
                <div className="bg-white border-b border-slate-200 p-2 flex gap-1 items-center flex-wrap">
                  <div className="flex gap-1 border-r border-slate-200 pr-2 mr-2">
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Type size={18} /></button>
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600 font-bold">B</button>
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600 italic">I</button>
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600 underline">U</button>
                  </div>
                  <div className="flex gap-1 border-r border-slate-200 pr-2 mr-2">
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600 flex items-center gap-1"><ImageIcon size={18} /> <span className="text-xs">이미지</span></button>
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600 flex items-center gap-1"><Video size={18} /> <span className="text-xs">동영상</span></button>
                  </div>
                  <div className="flex gap-1">
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600">H1</button>
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600">H2</button>
                     <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-600">Quote</button>
                  </div>
                </div>
                
                {/* Editor Content Area */}
                <textarea 
                  className="flex-1 w-full bg-slate-50 p-6 focus:outline-none resize-none" 
                  placeholder="여기에 상품 상세 설명을 작성하세요. 텍스트, 이미지 드래그 등을 자유롭게 배치할 수 있습니다."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
             </div>

             <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setActiveTab('basic')} className="btn btn-outline">이전</button>
                <button type="button" onClick={() => setActiveTab('options')} className="btn btn-primary">다음: 옵션 및 재고</button>
             </div>
          </div>

          {/* ----- STEP 3: OPTIONS & STOCK ----- */}
          <div className={activeTab === 'options' ? 'block space-y-8' : 'hidden'}>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
               <div className="flex items-center gap-3">
                 <Layers className="text-emerald-600" size={24} />
                 <div>
                   <h3 className="font-bold text-slate-900">옵션 사용 여부</h3>
                   <p className="text-sm text-slate-500">사이즈, 색상 등 옵션이 있는 상품인가요?</p>
                 </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" className="sr-only peer" checked={useOptions} onChange={(e) => setUseOptions(e.target.checked)} />
                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
               </label>
            </div>

            {useOptions ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                {/* Option Groups Config */}
                <div className="space-y-4">
                   {optionGroups.map((group, idx) => (
                     <div key={group.id} className="p-4 border border-slate-200 rounded-xl space-y-4 bg-white shadow-sm">
                       <div className="flex items-center gap-4">
                         <span className="font-bold text-slate-400 w-6 text-center">{idx + 1}</span>
                         <input 
                            type="text" 
                            value={group.name} 
                            placeholder="옵션명 (예: 사이즈)"
                            className="input w-48"
                            onChange={(e) => {
                               const newGroups = [...optionGroups];
                               newGroups[idx].name = e.target.value;
                               setOptionGroups(newGroups);
                            }}
                         />
                         <div className="h-6 w-px bg-slate-200 mx-2"></div>
                         <div className="flex-1 flex flex-wrap gap-2">
                            {group.values.map(val => (
                              <span key={val} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1">
                                {val}
                                <button type="button" onClick={() => removeOptionValue(idx, val)} className="hover:text-emerald-900"><XIcon size={14}/></button>
                              </span>
                            ))}
                            <input 
                              type="text"
                              placeholder="+ 값 추가 (Enter)"
                              className="bg-transparent border-none text-sm focus:ring-0 w-32"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addOptionValue(idx, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                         </div>
                       </div>
                     </div>
                   ))}
                </div>

                {/* Variants Table */}
                <div className="space-y-2">
                   <h3 className="font-bold text-slate-800">품목 리스트</h3>
                   <div className="border border-slate-200 rounded-xl overflow-hidden">
                     <table className="w-full text-left bg-white">
                       <thead className="bg-slate-50 border-b border-slate-200">
                         <tr>
                           <th className="py-3 px-4 font-semibold text-slate-500 w-[40%]">옵션 조합</th>
                           <th className="py-3 px-4 font-semibold text-slate-500 w-[20%]">추가 금액 ($)</th>
                           <th className="py-3 px-4 font-semibold text-slate-500 w-[20%]">재고 수량</th>
                           <th className="py-3 px-4 font-semibold text-slate-500 w-[20%]">SKU 관리</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {variants.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400">옵션 값을 입력하면 리스트가 생성됩니다.</td>
                           </tr>
                         ) : (
                           variants.map(variant => (
                             <tr key={variant.id} className="hover:bg-slate-50">
                               <td className="py-3 px-4">
                                 <div className="flex gap-2">
                                   {Object.entries(variant.options).map(([key, val]) => (
                                      <span key={key} className="text-slate-700 font-medium">{val}</span>
                                   ))}
                                 </div>
                               </td>
                               <td className="py-3 px-4">
                                 <input type="number" className="input py-1 px-2 h-8 text-sm" placeholder="0" />
                               </td>
                               <td className="py-3 px-4">
                                  <input type="number" className="input py-1 px-2 h-8 text-sm" defaultValue={10} />
                               </td>
                               <td className="py-3 px-4 text-sm text-slate-400">
                                  {/* Mock SKU */}
                                  GD-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                               </td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                   </div>
                </div>

              </div>
            ) : (
               <div className="p-8 border border-slate-200 border-dashed rounded-xl bg-slate-50 text-center animate-in fade-in">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                     <Package className="text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-1">단일 상품입니다</h3>
                  <p className="text-slate-500 text-sm mb-6">옵션이 없다면 기본 재고 수량만 입력하세요.</p>
                  
                  <div className="max-w-xs mx-auto field">
                    <label className="label text-slate-700">재고 수량</label>
                    <input type="number" className="input text-center" defaultValue={100} />
                  </div>
               </div>
            )}

            <div className="flex justify-between pt-8 border-t border-slate-100 mt-8">
               <button type="button" onClick={() => setActiveTab('detail')} className="btn btn-outline">이전</button>
               <button 
                  type="button" 
                  onClick={handleSubmit} 
                  className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-emerald-200"
               >
                 상품 등록 완료
               </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

// Helper for X icon since Lucide might not export 'XIcon' named specifically, let's just use X from lucide
// But wait, I imported X in previous files as X. Let's check imports.
// I didn't import X in this file. Let me add it.
// Actually I'll just use a local small component or add X to imports. I check imports at top.
function XIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

export default AdminGoodsUpload;
