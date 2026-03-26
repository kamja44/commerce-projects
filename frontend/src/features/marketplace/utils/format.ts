/**
 * Marketplace 관련 포맷팅 유틸 함수
 */

/**
 * 가격 포맷팅 함수
 * - 숫자를 한국 원화 형식으로 변환
 * @param price - 숫자 가격 (예: 850000)
 * @returns 포맷된 가격 문자열 (예: "850,000원")
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

/**
 * 상품 상태 텍스트 변환
 * - 영문 상태를 한글로 변환
 * @param status - 상품 상태 ('available' | 'sold' | 'reserved')
 * @returns 한글 상태 텍스트
 */
export function getStatusText(status: string): string {
  const statusMap = {
    available: '판매중',
    sold: '판매완료',
    reserved: '예약중',
  };
  return statusMap[status as keyof typeof statusMap] || status;
}

/**
 * 상품 상태별 Tailwind CSS 클래스 반환
 * - 상태에 따라 다른 색상의 배지 스타일 적용
 * @param status - 상품 상태
 * @returns Tailwind CSS 클래스 문자열
 */
export function getStatusClass(status: string): string {
  const classMap = {
    available: 'bg-green-100 text-green-800',
    sold: 'bg-gray-100 text-gray-800',
    reserved: 'bg-yellow-100 text-yellow-800',
  };
  return classMap[status as keyof typeof classMap] || 'bg-gray-100 text-gray-800';
}
