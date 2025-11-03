import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';

/**
 * MarketplaceService - 중고거래 비즈니스 로직
 */
@Injectable()
export class MarketplaceService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  /**
   * 상품 등록
   * - 새로운 중고 상품을 등록합니다
   */
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = new this.productModel({
      ...createProductDto,
      status: 'avaliable', // default Value
    });
    return newProduct.save();
  }

  /**
   * 상품 목록 조회
   * - 전체 상품 목록을 조회합니다
   * - 최신순으로 정렬
   */
  getProducts(): Promise<Product[]> {
    return this.productModel
      .find()
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  /**
   * 상품 상세 조회
   * - ID로 특정 상품을 조회합니다
   */
  async getProductById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  /**
   * 카테고리별 상품 조회
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.productModel.find({ category }).sort({ createdAt: -1 }).exec();
  }
}
