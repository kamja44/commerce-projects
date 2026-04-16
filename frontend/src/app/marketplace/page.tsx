import { ProductList } from '@/components/ProductList';
import { ProductFormModal } from '@/components/ProductFormModal';
import { Suspense } from 'react';
import { ProductListSkeleton } from '@/components/ProductListSkeleton';
import { Product } from '@/features/marketplace/types/product';
import { STATIC_BLUR_DATA_URL } from '@/features/marketplace/utils/blurDataURL';

export const metadata = {
  title: '중고거래 | 통합 커머스 플랫폼',
  description: '안전하고 편리한 중고 물품 거래',
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/marketplace/products`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  return res.json();
}

type ProductWithBlur = Product & { blurDataURL?: string };

function enrichProductsWithBlur(products: Product[]): ProductWithBlur[] {
  return products.map((product) => ({
    ...product,
    blurDataURL: product.images?.[0] ? STATIC_BLUR_DATA_URL : undefined,
  }));
}

export default async function MarketplacePage() {
  const products = await getProducts();
  const enrichedProducts = enrichProductsWithBlur(products);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">중고거래</h1>
          <p className="text-gray-600">안전하고 편리한 중고 물품 거래</p>
        </div>
        <ProductFormModal />
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList initialProducts={enrichedProducts} />
      </Suspense>
    </div>
  );
}
