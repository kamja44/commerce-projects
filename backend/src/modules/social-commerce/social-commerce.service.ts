import { Injectable } from '@nestjs/common';

/**
 * SocialCommerceService - 소셜 커머스 비즈니스 로직
 */
@Injectable()
export class SocialCommerceService {
  getFeed() {
    return {
      message: '소셜 피드가 곧 구현됩니다.',
      data: [],
    };
  }

  // TODO: 피드 CRUD, 라이브 커머스, 인플루언서 추천
}
