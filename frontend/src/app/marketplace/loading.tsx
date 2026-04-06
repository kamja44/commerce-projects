import { ProductListSkeleton } from '@/components/ProductListSkeleton';

export default function MarketplaceLoading() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-9 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-60 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      <ProductListSkeleton />
    </div>
  );
}
