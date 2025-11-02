import { Injectable } from '@nestjs/common';

/**
 * SubscriptionService - 구독 커머스 비즈니스 로직
 */
@Injectable()
export class SubscriptionService {
  getPlans() {
    return {
      message: '구독 플랜 목록이 곧 구현됩니다.',
      data: [],
    };
  }

  // TODO: 구독 CRUD, 주기 관리, 결제 연동
}
