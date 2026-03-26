import { z } from 'zod';

/**
 * 상품 등록 폼 Zod 스키마
 * - 각 필드에 대한 유효성 검증 규칙 정의
 */
export const productFormSchema = z.object({
  /**
   * 상품 제목
   * - 필수: 최소 2자 이상
   */
  title: z
    .string()
    .min(2, '제목은 최소 2자 이상이어야 합니다')
    .max(100, '제목은 최대 100자까지 입력 가능합니다'),

  /**
   * 상품 설명
   * - 필수: 최소 10자 이상
   */
  description: z
    .string()
    .min(10, '설명은 최소 10자 이상이어야 합니다')
    .max(1000, '설명은 최대 1000자까지 입력 가능합니다'),

  /**
   * 가격
   * - 필수: 0보다 큰 숫자
   */
  price: z.coerce
    .number({
      message: '올바른 숫자를 입력해주세요',
    })
    .positive('가격은 0보다 커야 합니다')
    .max(1000000000, '가격이 너무 큽니다'),

  /**
   * 카테고리
   * - 필수: 정해진 카테고리 중 하나
   */
  category: z.enum(['전자기기', '가구', '의류', '도서', '기타'], {
    errorMap: () => ({ message: '카테고리를 선택해주세요' }),
  }),

  /**
   * 거래 지역
   * - 선택: 빈 문자열 허용
   */
  location: z.string().optional(),

  /**
   * 이미지 URL
   * - 선택: 쉼표로 구분된 URL 문자열
   */
  images: z.string().optional(),

  /**
   * 판매자 이름
   * - 선택: 빈 문자열 허용
   */
  sellerName: z.string().optional(),
});

/**
 * Zod 스키마로부터 타입 추론
 */
export type ProductFormData = z.infer<typeof productFormSchema>;
