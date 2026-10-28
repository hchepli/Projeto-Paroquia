import { Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginBodyGuard } from './guards/login-body.guard';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import type {
  AuthenticatedRequest,
  LoginRequest,
} from './types/authenticated-request';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // Ordem: rate limit -> formato do corpo -> credenciais
  @Public()
  @UseGuards(LoginThrottlerGuard, LoginBodyGuard, LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  @Post('login')
  login(@Request() req: LoginRequest) {
    return this.authService.login(req.user);
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findOne(req.user.userId);
  }
}
