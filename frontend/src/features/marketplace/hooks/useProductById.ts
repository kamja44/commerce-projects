'use client';

import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../api/productApi';

export function useProductById(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => getProductById(id),
    enabled: !!id, // id가 있을 때만 쿼리 실행
  });
}
