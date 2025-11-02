import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SocialCommerceService } from './social-commerce.service';

@ApiTags('Social Commerce')
@Controller('social-commerce')
export class SocialCommerceController {
  constructor(private readonly socialCommerceService: SocialCommerceService) {}

  @Get('feed')
  @ApiOperation({ summary: '소셜 피드 조회' })
  getFeed() {
    return this.socialCommerceService.getFeed();
  }
}
