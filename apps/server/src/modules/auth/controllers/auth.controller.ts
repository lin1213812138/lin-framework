import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Public, CurrentUser } from '@/core/decorators';

import { AuthService } from '@/modules/auth/services/auth.service';
import type {
  TokenResponse,
  AuthUser,
} from '@/modules/auth/interfaces/auth.interface';
import { RegisterDto } from '@/modules/auth/dtos/register.dto';
import { LoginDto } from '@/modules/auth/dtos/login.dto';
import { RefreshTokenDto } from '@/modules/auth/dtos/refresh-token.dto';
import { LogoutDto } from '@/modules/auth/dtos/logout.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() dto: RegisterDto): Promise<TokenResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() dto: LoginDto): Promise<TokenResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新令牌' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '登出' })
  async logout(
    @Body() dto: LogoutDto,
    @Headers('authorization') authorization?: string,
  ): Promise<void> {
    const accessToken = authorization?.replace('Bearer ', '') ?? '';
    await this.authService.logout(accessToken, dto.refreshToken);
  }

  @Public()
  @Get('captcha')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取验证码' })
  async captcha(): Promise<{ id: string; svg: string }> {
    return this.authService.getCaptcha();
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async profile(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }
}
