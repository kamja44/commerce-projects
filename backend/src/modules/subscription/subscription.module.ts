import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

/**
 * SubscriptionModule - 구독 커머스 모듈
 * - 구독 상품 관리
 * - 구독 플랜 설정
 * - 정기 결제
 */
@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
