import apiClient from '@/shared/api/client';
import { CreateProductRequest, Product } from '../types/product';

/**
 * 상품 목록 조회
 * - GET /marketplace/products
 */
export async function getProducts(): Promise<Product[]> {
  const response = await apiClient.get<Product[]>('/marketplace/products');
  return response.data;
}

/**
 * 상품 상세 조회
 * - GET /marketplace/products/:id
 */
export async function getProductById(id: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/marketplace/products/${id}`);
  return response.data;
}

/**
 * 상품 등록
 * - POST /marketplace/products
 */
export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const response = await apiClient.post<Product>(`/marketplace/products`, data);
  return response.data;
}

/**
 * 카테고리별 상품 조회
 * - GET /marketplace/products/category/:category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const response = await apiClient.get<Product[]>(`/marketplace/products/category/${category}`);
  return response.data;
}
