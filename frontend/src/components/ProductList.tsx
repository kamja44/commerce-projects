'use client';

import { memo, useCallback, useState } from 'react';
import { useProducts, useProductsByCategory } from '@/features/marketplace/hooks';
import { Product, ProductCategory } from '@/features/marketplace/types/product';
import { ProductCard } from './ProductCard';
import { ProductListSkeleton } from './ProductListSkeleton';

type ProductWithBlur = Product & { blurDataURL?: string };

interface CategoryButtonProps {
  label: string;
  value: string;
  isSelected: boolean;
  onSelect: (category: string) => void;
}

const CategoryButton = memo(function CategoryButton({ label, value, isSelected, onSelect }: CategoryButtonProps) {
  const handleClick = useCallback(() => {
    onSelect(value);
  }, [onSelect, value]);

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 rounded-full transition-colors ${
        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  );
});

interface ProductListProps {
  initialProducts?: ProductWithBlur[];
  onProductClick?: (product: Product) => void;
}

export function ProductList({ onProductClick, initialProducts }: ProductListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories: ProductCategory[] = ['전자기기', '가구', '의류', '도서', '기타'];

  const allProductsQuery = useProducts({ initialData: initialProducts });
  const categoryProductsQuery = useProductsByCategory(selectedCategory);

  const activeQuery = selectedCategory ? categoryProductsQuery : allProductsQuery;
  const { data: products, isLoading, error } = activeQuery;

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleProductClick = useCallback(
    (product: Product) => {
      onProductClick?.(product);
    },
    [onProductClick],
  );

  if (isLoading) {
    return <ProductListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-red-600">
          상품을 불러오는데 실패했습니다.
          <br />
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">등록된 상품이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 카테고리 필터 */}
      <div className="flex gap-2 flex-wrap">
        <CategoryButton
          label="전체"
          value=""
          isSelected={selectedCategory === ''}
          onSelect={handleCategorySelect}
        />
        {categories.map((category) => (
          <CategoryButton
            key={category}
            label={category}
            value={category}
            isSelected={selectedCategory === category}
            onSelect={handleCategorySelect}
          />
        ))}
      </div>

      {/* 상품 개수 표시 */}
      <div className="text-sm text-gray-600">총 {products.length}개의 상품</div>

      {/* 상품 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard key={product._id} index={index} product={product} onClick={handleProductClick} />
        ))}
      </div>
    </div>
  );
}
