/**
 * 공통 사용자 타입
 */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 공통 API 응답 타입
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 페이지네이션 타입
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 페이지네이션된 응답 타입
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
