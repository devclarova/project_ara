import React, { useState } from 'react';
import { Search, Edit, Trash2, Eye, EyeOff, ChevronDown, Calendar, Package, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AdminGoodsManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  const [goods, setGoods] = useState([
    {
      id: 1,
      name: '브레이킹 배드 티셔츠',
      category: '의류',
      price: 29.99,
      salePrice: 24.99,
      stock: 150,
      status: 'active',
      visible: true,
      createdAt: '2024-01-15',
      image: '/placeholder-product.jpg',
    },
    {
      id: 2,
      name: '프렌즈 머그컵',
      category: '액세서리',
      price: 15.99,
      salePrice: 0,
      stock: 0,
      status: 'soldout',
      visible: true,
      createdAt: '2024-01-10',
      image: '/placeholder-product.jpg',
    },
    {
      id: 3,
      name: '왕좌의 게임 포스터',
      category: '문구',
      price: 19.99,
      salePrice: 0,
      stock: 50,
      status: 'draft',
      visible: false,
      createdAt: '2024-01-20',
      image: '/placeholder-product.jpg',
    },
  ]);

  const handleToggleVisibility = (id: number) => {
    setGoods(goods.map(product => 
      product.id === id ? { ...product, visible: !product.visible } : product
    ));
    const product = goods.find(p => p.id === id);
    toast.success(product?.visible ? '상품을 숨겼습니다' : '상품을 표시했습니다');
  };

  const handleEdit = (id: number) => {
    navigate(`/admin/goods/edit/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedProduct(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedProduct) {
      setGoods(goods.filter(p => p.id !== selectedProduct));
      toast.success('상품이 삭제되었습니다');
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const getStatusBadge = (status: string, stock: number) => {
    if (status === 'draft') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">작성중</span>;
    }
    if (stock === 0) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">품절</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-primary-900/30 text-primary">판매중</span>;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">상품 관리</h1>
          <p className="text-muted-foreground mt-1">등록된 상품을 관리합니다</p>
        </div>
        <button
          onClick={() => navigate('/admin/goods/new')}
          className="w-full md:w-auto px-4 py-2 bg-primary hover:bg-primary-600 dark:bg-primary dark:hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <Package size={18} />
          새 상품 등록
        </button>
      </div>

      <div className="bg-secondary rounded-xl border-2 border-gray-300 dark:border-gray-500 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="상품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-1 focus:ring-primary/30 dark:focus:ring-1 focus:ring-primary/30 focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-1 focus:ring-primary/30 dark:focus:ring-1 focus:ring-primary/30 focus:border-transparent bg-background text-foreground"
            >
              <option value="all">전체 상태</option>
              <option value="active">판매중</option>
              <option value="soldout">품절</option>
              <option value="draft">작성중</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
          </div>

          <div className="relative">
            <select className="appearance-none px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-1 focus:ring-primary/30 dark:focus:ring-1 focus:ring-primary/30 focus:border-transparent bg-background text-foreground">
              <option value="all">전체 카테고리</option>
              <option value="clothing">의류</option>
              <option value="accessories">액세서리</option>
              <option value="stationery">문구</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      <div className="bg-secondary rounded-xl border-2 border-gray-300 dark:border-gray-500 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted border-b border-gray-300 dark:border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">상품</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">카테고리</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">가격</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">재고</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">상태</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">표시</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">등록일</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {goods.map((product) => (
              <tr key={product.id} className="hover:bg-muted dark:hover:bg-accent700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0"></div>
                    <div className="font-medium text-foreground">{product.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted-foreground">{product.category}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className={`font-medium ${product.salePrice > 0 ? 'text-primary' : 'text-foreground'}`}>
                      ${product.salePrice > 0 ? product.salePrice.toFixed(2) : product.price.toFixed(2)}
                    </span>
                    {product.salePrice > 0 && (
                      <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${product.stock === 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                    {product.stock}개
                  </span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(product.status, product.stock)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleVisibility(product.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      product.visible ? 'bg-primary dark:bg-primary' : 'bg-muted '
                    }`}
                    title={product.visible ? '숨기기' : '표시하기'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-muted transition-transform ${
                        product.visible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar size={14} />
                    {product.createdAt}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(product.id)}
                      className="p-2 text-muted-foreground hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">총 {goods.length}개 상품</span>
        <div className="flex gap-2">
          <button className="px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-accent700 transition-colors">
            이전
          </button>
          <button className="px-3 py-2 bg-primary dark:bg-primary text-white rounded-lg">1</button>
          <button className="px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-accent700 transition-colors">
            2
          </button>
          <button className="px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-accent700 transition-colors">
            다음
          </button>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-foreground mb-2">상품 삭제</h3>
            <p className="text-muted-foreground mb-6">
              정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-accent700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGoodsManagement;
