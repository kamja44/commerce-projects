import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * AuthService - 인증 관련 비즈니스 로직
 */
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // TODO: 회원가입, 로그인 로직 구현
}
