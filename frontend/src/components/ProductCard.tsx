'use client';

import Image from 'next/image';
import { Product } from '@/features/marketplace/types/product';
import { formatPrice, getStatusClass, getStatusText } from '@/features/marketplace/utils';

type ProductWithBlur = Product & { blurDataURL?: string };

interface ProductCardProps {
  product: ProductWithBlur;
  index?: number;
  onClick?: (product: Product) => void;
}

export function ProductCard({ product, index = 0, onClick }: ProductCardProps) {
  return (
    <div
      onClick={() => onClick?.(product)}
      className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="aspect-square bg-gray-200 relative">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={index < 4}
            placeholder={product.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={product.blurDataURL}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
      </div>

      <div className="p-4">
        <span
          className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getStatusClass(product.status)}`}
        >
          {getStatusText(product.status)}
        </span>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>

        <p className="text-xl font-bold mb-2">{formatPrice(product.price)}</p>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{product.location || '위치 미정'}</span>
          <span className="text-gray-400">{product.category}</span>
        </div>

        {product.sellerName && (
          <p className="text-sm text-gray-500 mt-2">판매자: {product.sellerName}</p>
        )}
      </div>
    </div>
  );
}
