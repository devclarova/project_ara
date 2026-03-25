import React, { useState, useEffect } from 'react';
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
  Type,
  Loader2,
  X as XIcon,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { goodsService } from '@/services/goodsService';
import type { Product, ProductVariant as ServiceVariant } from '@/services/goodsService';

// Local UI Types
interface ProductOptionUI {
  id: string;
  name: string;
  values: string[];
}

interface ProductVariantUI {
  id: string;
  options: Record<string, string>;
  stock: number;
  additionalPrice: number;
  sku?: string;
}

const AdminGoodsUpload = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'basic' | 'detail' | 'options'>('basic');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // State
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('clothing');
  const [basePrice, setBasePrice] = useState('0');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [salePrice, setSalePrice] = useState(0);
  const [status, setStatus] = useState<'draft' | 'active' | 'soldout'>('draft');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [shippingFee, setShippingFee] = useState('0');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('0');
  
  // Settings
  const [isHidden, setIsHidden] = useState(false);
  const [badgeNew, setBadgeNew] = useState(false);
  const [badgeBest, setBadgeBest] = useState(false);

  const [useOptions, setUseOptions] = useState(false);
  const [optionGroups, setOptionGroups] = useState<ProductOptionUI[]>([
    { id: 'opt-1', name: 'Color', values: [] },
    { id: 'opt-2', name: 'Size', values: [] }
  ]);
  const [variants, setVariants] = useState<ProductVariantUI[]>([]);

  // Calculate sale price
  useEffect(() => {
    const price = Number(basePrice);
    const disc = Number(discountPercent);
    if (disc > 0) {
      setSalePrice(price * (1 - disc / 100));
    } else {
      setSalePrice(price);
    }
  }, [basePrice, discountPercent]);

  // Fetch data if edit mode
  useEffect(() => {
    if (id) {
      const fetchProductData = async () => {
        setLoading(true);
        try {
          const product = await goodsService.fetchProductById(id);
          if (product) {
            setProductName(product.name);
            setCategory(product.category || 'clothing');
            setBasePrice(product.price.toString());
            setDiscountPercent(product.discount_percent.toString());
            setSalePrice(product.sale_price);
            setStatus(product.status as any || 'draft');
            setSummary(product.summary || '');
            setDescription(product.description || '');
            setMainImage(product.main_image_url || null);
            setGalleryImages(product.gallery_urls || []);
            setShippingFee(product.shipping_fee?.toString() || '0');
            setFreeShippingThreshold(product.free_shipping_threshold?.toString() || '0');
            
            setIsHidden(product.is_hidden || false);
            setBadgeNew(product.badge_new || false);
            setBadgeBest(product.badge_best || false);
            
            if (product.options && product.options.length > 0) {
              setUseOptions(true);
              setOptionGroups(product.options.map((opt: any) => ({
                id: opt.id || Math.random().toString(),
                name: opt.name,
                values: opt.values
              })));
            }
            
            if (product.variants && product.variants.length > 0) {
              setVariants(product.variants.map((v: any) => ({
                id: v.id || Math.random().toString(),
                options: v.options,
                stock: v.stock,
                additionalPrice: Number(v.additional_price),
                sku: v.sku
              })));
            }
          }
        } catch (err) {
          console.error('Failed to fetch product for edit:', err);
          toast.error('상품 정보를 불러오는데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };
      fetchProductData();
    }
  }, [id]);

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await goodsService.uploadImage(file);
      setMainImage(url);
      toast.success("대표 이미지가 업로드되었습니다.");
    } catch (err: any) {
      toast.error(`업로드 실패: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(file => goodsService.uploadImage(file)));
      setGalleryImages(prev => [...prev, ...urls]);
      toast.success(`${files.length}장의 이미지가 업로드되었습니다.`);
    } catch (err: any) {
      toast.error(`업로드 실패: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDescriptionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await goodsService.uploadImage(file);
      setDescription(prev => prev + `\n![image](${url})\n`);
      toast.success("상세 이미지 삽입 완료");
    } catch (err: any) {
      toast.error(`업로드 실패: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const applyTextStyle = (style: 'bold' | 'h1') => {
    const textarea = document.getElementById('description-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    let newText = style === 'bold' ? `**${selectedText || 'text'}**` : `\n# ${selectedText || 'Heading'}\n`;
    setDescription(description.substring(0, start) + newText + description.substring(end));
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

  const generateVariants = (groups: ProductOptionUI[]) => {
    const group1 = groups[0]?.values || [];
    const group2 = groups[1]?.values || [];
    let newVariants: ProductVariantUI[] = [];
    
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

  const updateVariantValue = (id: string, field: 'stock' | 'additionalPrice' | 'sku', value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName) {
      toast.error("상품명은 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const productToSave: Partial<Product> = {
        id: id,
        name: productName,
        category,
        price: Number(basePrice),
        discount_percent: Number(discountPercent),
        sale_price: salePrice,
        summary,
        description,
        status,
        main_image_url: mainImage || undefined,
        gallery_urls: galleryImages,
        is_hidden: isHidden,
        badge_new: badgeNew,
        badge_best: badgeBest,
        badge_sale: Number(discountPercent) > 0,
        shipping_fee: Number(shippingFee),
        free_shipping_threshold: Number(freeShippingThreshold),
        stock: useOptions ? variants.reduce((acc, v) => acc + v.stock, 0) : 100
      };

      const optionsToSave = useOptions ? optionGroups
        .filter(g => g.values.length > 0)
        .map(g => ({ name: g.name, values: g.values })) : [];
        
      const variantsToSave = useOptions ? variants.map(v => ({
        options: v.options,
        stock: v.stock,
        additional_price: v.additionalPrice,
        sku: v.sku
      } as ServiceVariant)) : [];

      await goodsService.saveProduct(productToSave, optionsToSave, variantsToSave);
      toast.success(id ? '상품 정보가 수정되었습니다.' : '새 상품이 등록되었습니다.');
      navigate('/admin/goods/manage');
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(`저장 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-12 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-white/20 dark:border-white/5 shadow-2xl">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/admin/goods/manage')} 
              className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-gray-200 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                {id ? '상품 정보 수정' : '새 상품 등록'}
              </h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                {id ? '등록된 상품의 상세 정보를 수정하고 업데이트합니다' : '스토어에 전시할 새로운 상품 정보를 입력합니다'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleSubmit}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
          >
            <Save size={18} />
            <span>저장하기</span>
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Preview Card - Even Smaller & Responsive */}
            <div className="p-3 sm:p-4 rounded-[2rem] bg-white dark:bg-zinc-900 border border-white/20 dark:border-white/5 space-y-2 shadow-xl max-w-[280px] mx-auto lg:max-w-none">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">실시간 미리보기</span>
               </div>
               <div className="aspect-square rounded-2xl bg-gray-100 dark:bg-zinc-800 overflow-hidden relative group border border-gray-200 dark:border-white/5 max-h-[200px] mx-auto transition-all duration-500 hover:scale-[1.02]">
                  {mainImage ? (
                    <img src={mainImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Preview" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <Package size={32} />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                    <p className="text-[8px] text-white/60 font-medium uppercase mb-0.5 tracking-tighter">미리보기</p>
                    <p className="text-xs font-bold text-white truncate mb-0.5">{productName || '상품명'}</p>
                    <p className="text-[10px] font-black text-primary">${salePrice.toFixed(2)}</p>
                  </div>
               </div>
            </div>

            {/* Navigation Tabs - Now below Preview */}
            <div className="p-3 rounded-[2rem] bg-white dark:bg-zinc-900 border border-white/20 dark:border-white/5 space-y-2 shadow-sm">
              <TabButtonUI active={activeTab === 'basic'} onClick={() => setActiveTab('basic')} label="기본 정보 및 가격" icon={Package} />
              <TabButtonUI active={activeTab === 'detail'} onClick={() => setActiveTab('detail')} label="상세 설명 편집" icon={Type} />
              <TabButtonUI active={activeTab === 'options'} onClick={() => setActiveTab('options')} label="배송 및 옵션 관리" icon={Layers} />
            </div>
          </div>

          {/* Main Form Content */}
          <div className="lg:col-span-9 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-white/20 dark:border-white/5 overflow-hidden shadow-2xl">
            <div className="p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* STEP 1: Basic & Pricing */}
                <div className={activeTab === 'basic' ? 'space-y-8' : 'hidden'}>
                  <section className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">기본 정보 및 가격 설정</h3>
                      <p className="text-xs text-gray-500">상품명, 카테고리, 판매 가격을 설정합니다</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">판매 상태</label>
                        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
                          {(['draft', 'active', 'soldout'] as const).map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(s)}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${status === s ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' : 'text-gray-400'}`}
                            >
                              {s === 'draft' ? '임시' : s === 'active' ? '판매' : '품절'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">카테고리</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {(['clothing', 'accessories', 'stationery', 'digital'] as const).map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategory(cat)}
                              className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all ${category === cat ? 'bg-primary/5 border-primary text-primary' : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-white/5 text-gray-400'}`}
                            >
                              {cat === 'clothing' ? '👕 의류' : cat === 'accessories' ? '💍 액세서리' : cat === 'stationery' ? '✏️ 문구' : '📱 디지털'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">공식 출시 명칭</label>
                      <input 
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="고유한 상품명을 입력하세요"
                        className="w-full h-14 px-6 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">가격 정보</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400">정가 ($)</label>
                            <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-zinc-700 rounded-xl font-bold text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400">할인 (%)</label>
                            <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-zinc-700 rounded-xl font-bold text-sm" />
                          </div>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400">실제 판매가</span>
                          <span className="text-xl font-black text-primary">${salePrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">배송 정책</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400">배송비 ($)</label>
                            <input type="number" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-zinc-700 rounded-xl font-bold text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400">무료배송 기준 ($)</label>
                            <input type="number" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-zinc-700 rounded-xl font-bold text-sm" />
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 font-medium leading-relaxed">설정된 배송비는 결제 단계에서 자동 적용됩니다.</p>
                      </div>
                    </div>
                  </section>

                  <section className="pt-6 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-3">
                    <ToggleButton active={badgeNew} onClick={() => setBadgeNew(!badgeNew)} label="신상품 태그" />
                    <ToggleButton active={badgeBest} onClick={() => setBadgeBest(!badgeBest)} label="베스트 태그" />
                    <ToggleButton active={isHidden} onClick={() => setIsHidden(!isHidden)} label="상품 페이지 숨김" isWarning />
                  </section>
                </div>

                {/* STEP 2: Detail Editor */}
                <div className={activeTab === 'detail' ? 'space-y-8' : 'hidden'}>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">상세 내용 및 에디터</h3>
                    <p className="text-xs text-gray-500">상품의 스토리와 상세 이미지를 구성합니다</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">상품 간략 요약</label>
                    <textarea 
                      value={summary} 
                      onChange={(e) => setSummary(e.target.value)} 
                      className="w-full h-20 p-5 bg-gray-50 dark:bg-zinc-800 rounded-2xl outline-none text-sm" 
                      placeholder="눈길을 사로잡을 한 줄 설명을 적어주세요" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">상품 갤러리 및 상세 설명</label>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                      <label className="aspect-square rounded-2xl bg-gray-50 dark:bg-zinc-800 border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all relative overflow-hidden group">
                        <input type="file" className="hidden" onChange={handleMainImageUpload} />
                        {mainImage ? (
                          <img src={mainImage} className="w-full h-full object-cover" alt="Main" />
                        ) : (
                          <Plus size={24} className="text-gray-300" />
                        )}
                        <span className="text-[8px] font-bold mt-1 text-gray-400 group-hover:text-primary transition-colors">대표 이미지</span>
                      </label>
                      {galleryImages.map((u, i) => (
                        <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                          <img src={u} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Trash2 size={20}/></button>
                        </div>
                      ))}
                      {galleryImages.length < 5 && (
                        <label className="aspect-square rounded-2xl bg-gray-50 dark:bg-zinc-800 border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center cursor-pointer"><input type="file" multiple className="hidden" onChange={handleGalleryImageUpload}/><Plus size={24} className="text-gray-300"/></label>
                      )}
                    </div>

                    <div className="border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden min-h-[400px] flex flex-col bg-gray-50 dark:bg-zinc-900 shadow-inner">
                      <div className="px-4 py-3 bg-white dark:bg-zinc-800 flex items-center gap-2 border-b border-gray-100 dark:border-white/5">
                        <EditorTool icon={Type} onClick={() => applyTextStyle('h1')} label="제목" />
                        <EditorTool icon={Plus} onClick={() => applyTextStyle('bold')} label="강조" />
                        <label className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg cursor-pointer flex items-center gap-2">
                          <input type="file" className="hidden" onChange={handleDescriptionImageUpload}/>
                          <ImageIcon size={14} className="text-gray-500" />
                          <span className="text-[9px] font-black uppercase text-gray-400">이미지 추가</span>
                        </label>
                      </div>
                      <textarea id="description-editor" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1 w-full p-8 bg-transparent outline-none resize-none text-sm leading-loose" placeholder="상품의 특징과 가치를 풍부하게 설명해 주세요..." />
                    </div>
                  </div>
                </div>

                {/* STEP 3: Options */}
                <div className={activeTab === 'options' ? 'space-y-8' : 'hidden'}>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">배송 및 옵션 설정</h3>
                    <p className="text-xs text-gray-500">구매 옵션과 배송 관련 상세 설정을 관리합니다</p>
                  </div>

                  <div className={`p-8 rounded-[2rem] border-2 transition-all ${useOptions ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${useOptions ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-gray-200 text-gray-400'}`}><Layers size={24} /></div>
                        <div>
                          <h4 className="text-lg font-black">상품 옵션 사용하기</h4>
                          <p className="text-[10px] font-medium opacity-60">색상, 사이즈 등 품목별 상세 가격과 재고 관리가 가능해집니다</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setUseOptions(!useOptions)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${useOptions ? 'bg-primary' : 'bg-gray-300 dark:bg-zinc-600'}`}><div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${useOptions ? 'left-[30px]' : 'left-0.5'}`} /></button>
                    </div>
                  </div>

                  {useOptions && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {optionGroups.map((group, idx) => (
                           <div key={group.id} className="p-6 rounded-3xl bg-gray-50 dark:bg-zinc-800 border border-transparent space-y-4">
                              <span className="text-[9px] font-black text-primary uppercase">옵션 그룹 {idx + 1}</span>
                              <input type="text" value={group.name} onChange={(e) => { const n = [...optionGroups]; n[idx].name = e.target.value; setOptionGroups(n); }} className="w-full bg-transparent border-none p-0 focus:ring-0 text-lg font-bold" placeholder="예: 사이즈, 색상" />
                              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                                 {group.values.map(v => (
                                    <span key={v} className="pl-3 pr-1 py-1.5 bg-white dark:bg-zinc-700 rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-2">{v}<button type="button" onClick={() => removeOptionValue(idx, v)} className="p-1 hover:text-red-500 transition-colors"><XIcon size={12}/></button></span>
                                 ))}
                                 <input type="text" placeholder="+ 값 추가" className="bg-transparent text-[11px] font-bold focus:ring-0 w-20 outline-none" onKeyDown={(e) => { if(e.key==='Enter'){e.preventDefault(); addOptionValue(idx, e.currentTarget.value); e.currentTarget.value='';} }} />
                              </div>
                           </div>
                        ))}
                      </div>

                      <div className="rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-2xl bg-white dark:bg-zinc-900">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-800"><tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest"><th className="px-6 py-4">옵션 조합</th><th className="px-6 py-4">추가 금액 ($)</th><th className="px-6 py-4">재고 수량</th><th className="px-6 py-4 text-right">관리번호(SKU)</th></tr></thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                              {variants.map(v => (
                                <tr key={v.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                                  <td className="px-6 py-4"><span className="px-3 py-1 bg-gray-100 dark:bg-zinc-700 rounded-lg text-[10px] font-black text-primary">{Object.values(v.options).join(' / ')}</span></td>
                                  <td className="px-6 py-4"><input type="number" value={v.additionalPrice} onChange={(e) => updateVariantValue(v.id, 'additionalPrice', Number(e.target.value))} className="bg-transparent border-none p-0 focus:ring-0 text-xs font-black w-12" /></td>
                                  <td className="px-6 py-4"><input type="number" value={v.stock} onChange={(e) => updateVariantValue(v.id, 'stock', Number(e.target.value))} className="bg-transparent border-none p-0 focus:ring-0 text-xs font-black w-12" /></td>
                                  <td className="px-6 py-4 text-right"><input type="text" value={v.sku || ''} onChange={(e) => updateVariantValue(v.id, 'sku', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 text-[10px] font-mono text-gray-400 text-right" placeholder="자동 생성" /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButtonUI = ({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon: any }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}>
    <div className={`p-2 rounded-xl ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-zinc-700'}`}><Icon size={18} /></div>
    {label}
  </button>
);

const ToggleButton = ({ active, onClick, label, isWarning }: { active: boolean, onClick: () => void, label: string, isWarning?: boolean }) => (
  <button type="button" onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${active ? (isWarning ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-primary border-primary text-white shadow-lg') : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/5 text-gray-400 hover:border-gray-300'}`}>
    <div className={`w-3.5 h-3.5 rounded-full border-2 border-current flex items-center justify-center`}>{active && <div className="w-1.5 h-1.5 bg-current rounded-full" />}</div>
    {label}
  </button>
);

const EditorTool = ({ icon: Icon, onClick, label }: { icon: any, onClick: () => void, label: string }) => (
  <button type="button" onClick={onClick} className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-all flex items-center gap-2 group">
    <Icon size={14} className="text-gray-500 group-hover:text-primary" />
    <span className="text-[9px] font-black text-gray-400 uppercase">{label}</span>
  </button>
);

export default AdminGoodsUpload;
