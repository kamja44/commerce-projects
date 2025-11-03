import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /**
   * 상품 등록
   */
  @Post('products')
  @ApiOperation({ summary: '중고 상품 등록' })
  @ApiResponse({ status: 201, description: '상품이 성공적으로 등록되었습니다.' })
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.marketplaceService.createProduct(createProductDto);
  }

  /**
   * 전체 상품 목록 조회
   */
  @Get('products')
  @ApiOperation({ summary: '중고 상품 목록 조회' })
  @ApiResponse({ status: 200, description: '상품 목록을 성공적으로 조회했습니다.' })
  getProducts() {
    return this.marketplaceService.getProducts();
  }

  /**
   * 상품 상세 조회
   */
  @Get('products/:id')
  @ApiOperation({ summary: '중고 상품 상세 조회' })
  @ApiResponse({ status: 200, description: '상품 상세 정보를 성공적으로 조회했습니다.' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없습니다.' })
  getProductById(@Param('id') id: string) {
    return this.marketplaceService.getProductById(id);
  }

  /**
   * 카테고리별 상품 조회
   */
  @Get('products/category/:category')
  @ApiOperation({ summary: '카테고리별 상품 조회' })
  getProductsByCategory(@Param('category') category: string) {
    return this.marketplaceService.getProductsByCategory(category);
  }
}
