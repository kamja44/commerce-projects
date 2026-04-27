'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/productApi';
import { Product } from '../types/product';

interface UseProductsOptions {
  initialData?: Product[];
}

export function useProducts(options?: UseProductsOptions) {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    initialData: options?.initialData,
    staleTime: 60 * 1000,
  });
}
