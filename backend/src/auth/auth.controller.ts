import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  async register(@Body() registerDto: any) {
    return { message: '회원가입 기능이 곧 구현됩니다.' };
  }

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  async login(@Body() loginDto: any) {
    return { message: '로그인 기능이 곧 구현됩니다.' };
  }
}
