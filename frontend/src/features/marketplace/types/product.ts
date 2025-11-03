// 상품 상태
export type ProductStatus = 'avaliable' | 'sold' | 'reserved';

// 카테고리 타입
export type ProductCategory = '전자기기' | '가구' | '의류' | '도서' | '기타';

// 상품 인터페이스
export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  status: ProductStatus;
  images?: string[];
  location?: string;
  sellerId?: string;
  sellerName?: string;
  createdAt: string;
  updatedAt: string;
}

// 상품 등록 요청 타입
export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  location?: string;
  images?: string[];
  sellerName?: string;
}
