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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'basic' | 'detail' | 'options'>('basic');
  
  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    categoryId: '',
    price: 0,
    discountPercent: 0, // 할인율 (%)
    salePrice: 0, // 자동 계산될 최종 가격
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
    const numValue = type === 'number' ? Number(value) : value;
    
    setBasicInfo(prev => {
      const updated = {
        ...prev,
        [name]: numValue
      };
      
      // 가격 또는 할인율이 변경되면 최종 가격 자동 계산
      if (name === 'price' || name === 'discountPercent') {
        const price = name === 'price' ? Number(value) : prev.price;
        const discountPercent = name === 'discountPercent' ? Number(value) : prev.discountPercent;
        
        // 할인율이 0보다 크면 할인가 계산, 아니면 0
        if (discountPercent > 0) {
          updated.salePrice = price * (1 - discountPercent / 100);
        } else {
          updated.salePrice = 0;
        }
      }
      
      // 최종 가격이 직접 변경되면 할인율 역계산
      if (name === 'salePrice') {
        const salePrice = Number(value);
        const price = prev.price;
        
        if (price > 0 && salePrice > 0 && salePrice < price) {
          // 할인율 = (1 - 최종가격/원가) * 100
          updated.discountPercent = Math.round((1 - salePrice / price) * 100);
        } else if (salePrice === 0 || salePrice >= price) {
          updated.discountPercent = 0;
        }
      }
      
      return updated;
    });
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
    // Admin Goods Upload Logic
    toast.success(t('admin.goods_registered'));
  };

  // UI Components
  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 min-w-[100px] sm:min-w-[140px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
        activeTab === id 
          ? 'border-b-2 border-primary text-primary bg-primary/5' 
          : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
      }`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="w-full min-w-[300px] space-y-3 sm:space-y-4 md:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">새 상품 등록</h1>
          <p className="text-xs sm:text-sm text-muted-foreground break-words mt-1">판매할 상품을 등록합니다.</p>
        </div>
        <div className="flex-shrink-0">
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
          >
            <Save size={18} className="flex-shrink-0" />
            <span className="hidden xs:inline">저장하기</span>
            <span className="xs:hidden">저장</span>
          </button>
        </div>
      </div>

      <div className="bg-secondary rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-300 dark:border-gray-600 dark:border-border overflow-x-auto">
          <TabButton id="basic" label="기본 정보" icon={Package} />
          <TabButton id="detail" label="상세 정보" icon={Type} />
          <TabButton id="options" label="옵션 및 재고" icon={Layers} />
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 lg:p-8">

          {/* ----- STEP 1: BASIC INFO ----- */}
          <div className={activeTab === 'basic' ? 'block space-y-8' : 'hidden'}>
            
            {/* Status & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="field">
                <label className="label font-semibold text-foreground">판매 상태</label>
                <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                   {(['draft', 'active', 'soldout'] as const).map(status => (
                     <button
                        key={status}
                        type="button"
                        onClick={() => setBasicInfo(prev => ({...prev, status}))}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          basicInfo.status === status 
                            ? 'bg-secondary  text-primary shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                     >
                       {status === 'draft' ? '작성 중' : status === 'active' ? '판매 중' : '품절'}
                     </button>
                   ))}
                </div>
              </div>
              
              <div className="field">
                <label className="label font-semibold text-foreground">카테고리</label>
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
              <label className="label font-semibold text-foreground">상품명 <span className="text-red-500">*</span></label>
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


            {/* Price & Discount */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Original Price */}
                <div className="field">
                  <label className="label font-semibold text-foreground">원가 ($) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    name="price"
                    value={basicInfo.price}
                    onChange={handleBasicChange}
                    className="input text-lg" 
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Discount Percentage */}
                <div className="field">
                  <label className="label font-semibold text-foreground">
                    할인율 (%) 
                    <span className="text-muted-foreground font-normal text-xs ml-2">(0이면 할인 없음)</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="discountPercent"
                      value={basicInfo.discountPercent}
                      onChange={handleBasicChange}
                      className="input pr-12" 
                      placeholder="0"
                      min="0"
                      max="100"
                      step="1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                  </div>
                </div>

                {/* Final Price Input */}
                <div className="field">
                  <label className="label font-semibold text-foreground">
                    최종 판매가 ($)
                    <span className="text-muted-foreground font-normal text-xs ml-2">(직접 입력 가능)</span>
                  </label>
                  <input 
                    type="number" 
                    name="salePrice"
                    value={basicInfo.salePrice}
                    onChange={handleBasicChange}
                    className="input text-lg font-semibold text-primary" 
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Final Price Display */}
              {basicInfo.discountPercent > 0 && (
                <div className="bg-primary/10 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary font-medium mb-1">최종 판매가</p>
                      <p className="text-xs text-primary">
                        원가 ${basicInfo.price.toFixed(2)} - 할인 {basicInfo.discountPercent}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ${basicInfo.salePrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-primary">
                        절약: ${(basicInfo.price - basicInfo.salePrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Fee */}
              <div className="field">
                <label className="label font-semibold text-foreground">배송비 ($)</label>
                <input 
                  type="number" 
                  name="shippingFee"
                  value={basicInfo.shippingFee}
                  onChange={handleBasicChange}
                  className="w-full px-4 py-2.5 bg-secondary border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all" 
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
             {/* Summary */}
             <div className="field">
               <label className="label font-semibold text-foreground">간략 소개</label>
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
                 <label className="label font-semibold text-foreground">대표 이미지</label>
                 <div className="aspect-square bg-muted border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
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
                 <label className="label font-semibold text-foreground">추가 갤러리 이미지</label>
                 <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="aspect-square bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent cursor-pointer">
                        <Plus size={24} />
                      </div>
                    ))}
                 </div>
                 <p className="text-xs text-muted-foreground">* 최대 10장까지 등록 가능</p>
               </div>
             </div>

             {/* Badges */}
             <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
               <label className="label font-semibold text-foreground mb-4 block">상품 뱃지 설정</label>
               <div className="flex flex-wrap gap-4">
                 <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-gray-300 dark:border-gray-500 rounded-lg hover:bg-muted">
                   <input type="checkbox" checked={basicInfo.badge_new} onChange={(e) => handleCheckboxChange('badge_new', e.target.checked)} className="rounded text-primary focus:ring-1 focus:ring-primary/30" />
                   <span className="font-medium text-foreground">New (신상품)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-gray-300 dark:border-gray-500 rounded-lg hover:bg-muted">
                   <input type="checkbox" checked={basicInfo.badge_best} onChange={(e) => handleCheckboxChange('badge_best', e.target.checked)} className="rounded text-primary focus:ring-1 focus:ring-primary/30" />
                   <span className="font-medium text-foreground">Best (인기)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-gray-300 dark:border-gray-500 rounded-lg hover:bg-muted">
                   <input type="checkbox" checked={basicInfo.badge_sale} onChange={(e) => handleCheckboxChange('badge_sale', e.target.checked)} className="rounded text-primary focus:ring-1 focus:ring-primary/30" />
                   <span className="font-medium text-foreground">Sale (세일)</span>
                 </label>
               </div>
             </div>

             <div className="flex justify-end pt-4">
                <button type="button" onClick={() => setActiveTab('detail')} className="btn btn-primary">다음: 상세 정보</button>
             </div>
          </div>

          {/* ----- STEP 2: DETAIL (RICH TEXT) ----- */}
          <div className={activeTab === 'detail' ? 'block space-y-6' : 'hidden'}>
             <div className="bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl overflow-hidden min-h-[500px] flex flex-col">
                {/* Toolbar Mock */}
                <div className="bg-secondary border-b border-gray-300 dark:border-gray-600 p-2 flex gap-1 items-center flex-wrap">
                  <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground"><Type size={18} /></button>
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground font-bold">B</button>
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground italic">I</button>
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground underline">U</button>
                  </div>
                  <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground flex items-center gap-1"><ImageIcon size={18} /> <span className="text-xs">이미지</span></button>
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground flex items-center gap-1"><Video size={18} /> <span className="text-xs">동영상</span></button>
                  </div>
                  <div className="flex gap-1">
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground">H1</button>
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground">H2</button>
                     <button type="button" className="p-1.5 hover:bg-accent rounded text-muted-foreground">Quote</button>
                  </div>
                </div>
                
                {/* Editor Content Area */}
                <textarea 
                  className="flex-1 w-full bg-muted p-6 focus:outline-none resize-none" 
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
            
            <div className="flex items-center justify-between p-4 bg-muted border-2 border-gray-300 dark:border-gray-500 rounded-xl">
               <div className="flex items-center gap-3">
                 <Layers className="text-primary" size={24} />
                 <div>
                   <h3 className="font-bold text-foreground">옵션 사용 여부</h3>
                   <p className="text-sm text-muted-foreground">사이즈, 색상 등 옵션이 있는 상품인가요?</p>
                 </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" className="sr-only peer" checked={useOptions} onChange={(e) => setUseOptions(e.target.checked)} />
                 <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-secondary after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
               </label>
            </div>

            {useOptions ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                {/* Option Groups Config */}
                <div className="space-y-4">
                   {optionGroups.map((group, idx) => (
                     <div key={group.id} className="p-4 border-2 border-gray-300 dark:border-gray-500 rounded-xl space-y-4 bg-secondary shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex items-center gap-4">
                         <span className="font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
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
                         <div className="h-6 w-px bg-muted mx-2"></div>
                         <div className="flex-1 flex flex-wrap gap-2">
                            {group.values.map(val => (
                              <span key={val} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-1">
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
                         {/* Delete Option Group Button */}
                         <button
                           type="button"
                           onClick={() => toast.info(t('admin.option_group_delete_wip'))}
                           className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                           title="옵션 그룹 삭제"
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                     </div>
                   ))}
                   
                   {/* Add Option Group Button */}
                   <button
                     type="button"
                     onClick={() => toast.info(t('admin.option_group_add_wip'))}
                     className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary-50/30 transition-all flex items-center justify-center gap-2 font-medium"
                   >
                     <Plus size={20} />
                     옵션 그룹 추가
                   </button>
                </div>

                {/* Variants Table */}
                <div className="space-y-2">
                   <h3 className="font-bold text-foreground">품목 리스트</h3>
                   <div className="border-2 border-gray-300 dark:border-gray-500 rounded-xl overflow-hidden">
                     <table className="w-full text-left bg-secondary">
                       <thead className="bg-muted border-b border-gray-300 dark:border-gray-600">
                         <tr>
                           <th className="py-3 px-4 font-semibold text-muted-foreground w-[40%]">옵션 조합</th>
                           <th className="py-3 px-4 font-semibold text-muted-foreground w-[20%]">추가 금액 ($)</th>
                           <th className="py-3 px-4 font-semibold text-muted-foreground w-[20%]">재고 수량</th>
                           <th className="py-3 px-4 font-semibold text-muted-foreground w-[20%]">SKU 관리</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border100">
                         {variants.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="py-8 text-center text-muted-foreground">옵션 값을 입력하면 리스트가 생성됩니다.</td>
                           </tr>
                         ) : (
                           variants.map(variant => (
                             <tr key={variant.id} className="hover:bg-muted">
                               <td className="py-3 px-4">
                                 <div className="flex gap-2">
                                   {Object.entries(variant.options).map(([key, val]) => (
                                      <span key={key} className="text-foreground font-medium">{val}</span>
                                   ))}
                                 </div>
                               </td>
                               <td className="py-3 px-4">
                                 <input type="number" className="input py-1 px-2 h-8 text-sm" placeholder="0" />
                               </td>
                               <td className="py-3 px-4">
                                  <input type="number" className="input py-1 px-2 h-8 text-sm" defaultValue={10} />
                               </td>
                               <td className="py-3 px-4 text-sm text-muted-foreground">
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
               <div className="p-8 border-2 border-gray-300 dark:border-gray-500 border-dashed rounded-xl bg-muted text-center animate-in fade-in">
                  <div className="mx-auto w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-sm mb-3">
                     <Package className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">단일 상품입니다</h3>
                  <p className="text-muted-foreground text-sm mb-6">옵션이 없다면 기본 재고 수량만 입력하세요.</p>
                  
                  <div className="max-w-xs mx-auto field">
                    <label className="label text-foreground">재고 수량</label>
                    <input type="number" className="input text-center" defaultValue={100} />
                  </div>
               </div>
            )}

            <div className="flex justify-between pt-8 border-t border-gray-300 dark:border-gray-600 mt-8">
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
