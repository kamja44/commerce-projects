import { Injectable } from '@nestjs/common';

/**
 * MarketplaceService - 중고거래 비즈니스 로직
 */
@Injectable()
export class MarketplaceService {
  getProducts() {
    return {
      message: '중고거래 상품 목록이 곧 구현됩니다.',
      data: [],
    };
  }

  // TODO: 상품 CRUD, 검색, 필터링 구현
}
