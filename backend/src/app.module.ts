import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { SocialCommerceModule } from './modules/social-commerce/social-commerce.module';

/**
 * AppModule - 애플리케이션 루트 모듈
 * - MongoDB 연결
 * - 각 도메인 모듈 등록
 */
@Module({
  imports: [
    // MongoDB 연결 (환경변수에서 URI 가져옴)
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/commerce'),

    // 도메인 모듈
    AuthModule,
    MarketplaceModule,
    SubscriptionModule,
    SocialCommerceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
