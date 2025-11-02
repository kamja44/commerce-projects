import Card from '../../shared/components/Card';

/**
 * MarketplacePage 컴포넌트
 * - 역할: 중고거래 메인 페이지
 * - 기능: 중고 상품 목록 표시 (추후 구현)
 */
export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">중고거래</h1>
        <p className="text-gray-600">안전하고 편리한 중고 물품 거래</p>
      </div>

      <Card title="중고거래 상품 목록">
        <p className="text-gray-500 text-center py-8">
          중고거래 기능이 곧 준비됩니다.
          <br />
          상품 목록, 검색, 필터링 기능이 추가될 예정입니다.
        </p>
      </Card>
    </div>
  );
}
