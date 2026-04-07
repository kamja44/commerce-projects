'use client';

import { useState } from 'react';
import { useProducts, useProductsByCategory } from '@/features/marketplace/hooks';
import { Product, ProductCategory } from '@/features/marketplace/types/product';
import { ProductCard } from './ProductCard';
import { ProductListSkeleton } from './ProductListSkeleton';

/**
 * ProductList 컴포넌트
 * - 역할: 상품 목록 표시 및 카테고리 필터링
 * - 기능: 전체 상품 조회, 카테고리별 필터, 로딩/에러 처리
 */
interface ProductListProps {
  initialProducts?: Product[];
  onProductClick?: (product: Product) => void;
}

export function ProductList({ onProductClick, initialProducts }: ProductListProps) {
  /**
   * 선택된 카테고리 상태
   * - 용도: 카테고리 필터링을 위한 상태
   * - 빈 문자열: 전체 상품 조회
   */
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  /**
   * 카테고리 옵션 배열
   */
  const categories: ProductCategory[] = ['전자기기', '가구', '의류', '도서', '기타'];

  /**
   * 전체 상품 조회
   * - selectedCategory가 없을 때 사용
   */
  const allProductsQuery = useProducts({ initialData: initialProducts });

  /**
   * 카테고리별 상품 조회
   * - selectedCategory가 있을 때 사용
   * - enabled 옵션으로 조건부 실행 (useProductsByCategory.ts에 설정됨)
   */
  const categoryProductsQuery = useProductsByCategory(selectedCategory);

  /**
   * 현재 활성화된 쿼리 선택
   * - selectedCategory 여부에 따라 사용할 데이터 결정
   */
  const activeQuery = selectedCategory ? categoryProductsQuery : allProductsQuery;
  const { data: products, isLoading, error } = activeQuery;

  /**
   * 로딩 상태 처리
   */
  if (isLoading) {
    return <ProductListSkeleton />;
  }

  /**
   * 에러 상태 처리
   */
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

  /**
   * 상품이 없는 경우
   */
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
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-full transition-colors ${
            selectedCategory === ''
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full transition-colors ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 상품 개수 표시 */}
      <div className="text-sm text-gray-600">총 {products.length}개의 상품</div>

      {/* 상품 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} onClick={onProductClick} />
        ))}
      </div>
    </div>
  );
}
