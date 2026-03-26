import { ProductList } from '@/components/ProductList';

export const metadata = {
  title: '중고거래 | 통합 커머스 플랫폼',
  description: '안전하고 편리한 중고 물품 거래',
};

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">중고거래</h1>
        <p className="text-gray-600">안전하고 편리한 중고 물품 거래</p>
      </div>

      <ProductList />
    </div>
  );
}
