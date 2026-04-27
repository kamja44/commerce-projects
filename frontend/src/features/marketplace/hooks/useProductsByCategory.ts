'use client';

import { useQuery } from '@tanstack/react-query';
import { getProductsByCategory } from '../api/productApi';

export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: () => getProductsByCategory(category),
    enabled: !!category,
    staleTime: 60 * 1000,
  });
}
