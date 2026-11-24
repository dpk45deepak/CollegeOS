import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{10,128}$/;
const PASSWORD_MSG = 'password must be 10-128 characters and contain a letter and a digit';

export class LoginDto {
  @ApiPropertyOptional({ example: 'SDCET', description: 'College code. Omit only for platform super-admin login.' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  collegeCode?: string;

  @ApiProperty({ example: 'CSE2023001', description: 'College ID' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  loginId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ example: 'Pixel 8 / Chrome' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty() @IsString() @IsNotEmpty() collegeCode!: string;
  @ApiProperty() @IsEmail() email!: string;
}

export class ResetPasswordDto {
  @ApiProperty() @IsString() @MinLength(20) @MaxLength(256) token!: string;
  @ApiProperty() @Matches(PASSWORD_RULE, { message: PASSWORD_MSG }) newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty() @IsString() @MinLength(20) @MaxLength(256) token!: string;
}

export class ResendVerificationDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @IsNotEmpty() currentPassword!: string;
  @ApiProperty() @Matches(PASSWORD_RULE, { message: PASSWORD_MSG }) newPassword!: string;
}
