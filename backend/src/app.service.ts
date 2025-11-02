import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '통합 커머스 플랫폼 API is running!';
  }
}
