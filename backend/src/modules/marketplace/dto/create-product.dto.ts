import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * 상품 등록 DTO
 */
export class CreateProductDto {
  @ApiProperty({
    description: '상품 제목',
    example: '갤럭시 S22 판매합니다.',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '상품 설명',
    example: '1년 사용한 아이폰입니다. 상태 좋아요.',
  })
  @IsString()
  description: string;

  @ApiProperty({ description: '가격 (원)', example: 850000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: '카테고리',
    example: '전자기기',
    enum: ['전자기기', '가구', '의류', '도서', '기타'],
  })
  @IsEnum(['전자기기', '가구', '의류', '도서', '기타'])
  location?: string;

  @ApiProperty({
    description: '이미지 URL 배열',
    example: ['https://example.com/image1.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: '판매자 이름', example: '홍길동', required: false })
  @IsOptional()
  @IsString()
  sellerName?: string;
}
