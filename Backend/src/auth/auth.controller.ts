import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser, Public } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

const meta = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login with College ID + password',
    description: 'Public. Locks the account for 15 min after 5 failures.',
  })
  @ApiOkResponse({ description: '{ accessToken, refreshToken, expiresIn, sessionId }' })
  @ApiUnauthorizedResponse({
    description: 'INVALID_CREDENTIALS / EMAIL_NOT_VERIFIED / ACCOUNT_INACTIVE (423 ACCOUNT_LOCKED)',
  })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, meta(req));
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Rotate refresh token',
    description: 'Public. Old refresh token becomes invalid; reuse revokes the whole session family.',
  })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, meta(req));
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Logout current session' })
  async logout(@CurrentUser() user: Principal) {
    await this.auth.logout(user.sessionId);
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Logout every device' })
  async logoutAll(@CurrentUser() user: Principal) {
    await this.auth.logoutAll(user.userId);
  }

  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'List my active devices/sessions' })
  sessions(@CurrentUser() user: Principal) {
    return this.auth.listSessions(user.userId);
  }

  @ApiBearerAuth()
  @Delete('sessions/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke one of my sessions' })
  async revoke(@CurrentUser() user: Principal, @Param('id') id: string) {
    await this.auth.revokeOwnSession(user.userId, id);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Request a password-reset email',
    description: 'Always 202 — never reveals whether the account exists.',
  })
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.collegeCode, dto.email);
    return { message: 'If the account exists, a reset email has been sent.' };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Set a new password using an emailed token' })
  async reset(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(204)
  @ApiOperation({ summary: 'Verify email using an emailed token' })
  async verify(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(202)
  @ApiOperation({ summary: 'Resend verification email' })
  async resend(@Body() dto?: ResendVerificationDto, @CurrentUser() user?: Principal) {
    const target = dto?.email || user?.userId;
    if (target) {
      await this.auth.resendVerification(target);
    }
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Change password (revokes all sessions)' })
  async change(@CurrentUser() user: Principal, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.userId, dto.currentPassword, dto.newPassword);
  }
}
