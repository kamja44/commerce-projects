'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productFormSchema, ProductFormData } from '@/features/marketplace/schemas/productSchema';
import { useCreateProduct } from '@/features/marketplace/hooks';
import Button from '@/shared/components/Button';

interface ProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const { mutate: createProduct, isPending } = useCreateProduct();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
  });

  const onSubmit = (data: ProductFormData) => {
    const images = data.images
      ? data.images.split(',').map((url) => url.trim()).filter(Boolean)
      : [];

    createProduct(
      { ...data, images },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상품 제목 *</label>
        <input
          {...register('title')}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="상품 제목을 입력하세요"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명 *</label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="상품 설명을 입력하세요"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">가격 *</label>
        <input
          {...register('price')}
          type="number"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="가격을 입력하세요"
        />
        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
        <select
          {...register('category')}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">카테고리 선택</option>
          {(['전자기기', '가구', '의류', '도서', '기타'] as const).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">거래 지역</label>
        <input
          {...register('location')}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="거래 희망 지역"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이미지 URL (쉼표로 구분)
        </label>
        <input
          {...register('images')}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">판매자 이름</label>
        <input
          {...register('sellerName')}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="판매자 이름"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? '등록 중...' : '상품 등록'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            취소
          </Button>
        )}
      </div>
    </form>
  );
}
