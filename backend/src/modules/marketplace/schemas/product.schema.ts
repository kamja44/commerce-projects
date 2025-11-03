import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// 상품 상세 타입
export type ProductStatus = 'avaliable' | 'sold' | 'reserved';

// 카테고리 타입
export type ProductCategory = '전자기기' | '가구' | '의류' | '도서' | '기타';

/**
 * Product Schema - 중고거래 상품
 */
@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  title: string; // 상품 명

  @Prop({ required: true })
  description: string; // 상품 정보

  @Prop({ required: true })
  price: number; // 가격

  @Prop({ type: String, enum: ['전자기기', '가구', '의류', '도서', '기타'], required: true })
  category: ProductCategory;

  @Prop({ default: 'avaliable' })
  status: ProductStatus; // 상태(avaliable: 판매중, sold: 판매완료, reserved: 예약 중)

  @Prop()
  images?: string[]; // 이미지 URL

  @Prop()
  location?: string; // 거래 지역

  @Prop()
  sellerId?: string; // 판매자 ID(추후 User와 연결)

  @Prop()
  sellerName?: string; // 판매자 명

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
