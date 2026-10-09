import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { PortfolioItemType, Gender } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PASSWORD_RULE } from '../../auth/dto/auth.dto';

export class GuardianDto {
  @ApiProperty() @IsString() @MaxLength(120) name!: string;
  @ApiProperty() @IsString() @MaxLength(40) relation!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
}

export class CreateStudentDto {
  @ApiProperty({ example: 'CSE2023001', description: 'College ID (also the login ID)' })
  @IsString()
  @MaxLength(64)
  collegeStudentId!: string;
  @ApiProperty() @IsString() @MaxLength(32) rollNumber!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MaxLength(80) firstName!: string;
  @ApiProperty() @IsString() @MaxLength(80) lastName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiProperty() @IsString() departmentId!: string;
  @ApiProperty() @IsString() programId!: string;
  @ApiProperty() @IsString() batchId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sectionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() semesterId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() dateOfBirth?: Date;
  @ApiPropertyOptional({ enum: Gender }) @IsOptional() @IsEnum(Gender) gender?: Gender;
  @ApiPropertyOptional() @IsOptional() @IsObject() address?: Record<string, string>;
  @ApiPropertyOptional({ type: [GuardianDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
  @ApiPropertyOptional() @IsOptional() @Matches(PASSWORD_RULE) initialPassword?: string;
}
export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['collegeStudentId', 'email', 'initialPassword', 'guardians'] as const),
) {}

/** What a student may edit about themselves. */
export class UpdateMyProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() address?: Record<string, string>;
}

export class AddSkillDto {
  @ApiProperty() @IsString() @MaxLength(60) name!: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 5 }) @IsOptional() @IsInt() @Min(1) @Max(5) level?: number;
}
export class AddPortfolioItemDto {
  @ApiProperty({ enum: PortfolioItemType }) @IsEnum(PortfolioItemType) type!: PortfolioItemType;
  @ApiProperty() @IsString() @MaxLength(160) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() url?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() issuedAt?: Date;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) tags?: string[];
}

export class StudentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() programId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() batchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sectionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
