'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateProductRequest } from '../types/product';
import { createProduct } from '../api/productApi';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
