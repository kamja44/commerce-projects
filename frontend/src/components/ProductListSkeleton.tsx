import { ProductCardSkeleton } from './ProductCardSkeleton';

export function ProductListSkeleton() {
  return (
    <div className="space-y-6">
      {/* 카테고리 필터 스켈레톤 */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-16 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>

      {/* 상품 개수 스켈레톤 */}
      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />

      {/* 상품 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
