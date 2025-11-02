import { Module } from '@nestjs/common';
import { SocialCommerceController } from './social-commerce.controller';
import { SocialCommerceService } from './social-commerce.service';

/**
 * SocialCommerceModule - 소셜 커머스 모듈
 * - 소셜 피드
 * - 라이브 커머스
 * - 인플루언서 추천
 */
@Module({
  controllers: [SocialCommerceController],
  providers: [SocialCommerceService],
})
export class SocialCommerceModule {}
