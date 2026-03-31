'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';

const ProductForm = dynamic(
  () => import('@/components/ProductForm').then((m) => ({ default: m.ProductForm })),
  {
    loading: () => (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">폼 로딩 중...</p>
      </div>
    ),
    ssr: false,
  }
);

export function ProductFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        상품 등록
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">상품 등록</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <ProductForm
              onSuccess={handleClose}
              onCancel={handleClose}
            />
          </div>
        </div>
      )}
    </>
  );
}
