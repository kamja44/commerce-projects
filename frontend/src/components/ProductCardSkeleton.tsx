export function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 이미지 영역 */}
      <div className="aspect-square bg-gray-200 animate-pulse" />

      <div className="p-4 space-y-3">
        {/* 상태 뱃지 */}
        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />

        {/* 제목 */}
        <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />

        {/* 가격 */}
        <div className="h-7 w-1/3 bg-gray-200 rounded animate-pulse" />

        {/* 위치 + 카테고리 */}
        <div className="flex justify-between">
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/5 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
