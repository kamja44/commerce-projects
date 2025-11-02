import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

/**
 * MarketplaceModule - 중고거래 모듈
 * - 중고 상품 등록/조회/수정/삭제
 * - 거래 채팅
 */
@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
})
export class MarketplaceModule {}
