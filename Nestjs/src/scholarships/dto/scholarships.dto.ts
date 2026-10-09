import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ScholarshipType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateScholarshipDto {
  @ApiProperty({ enum: ScholarshipType }) @IsEnum(ScholarshipType) type!: ScholarshipType;
  @ApiProperty() @IsString() @MaxLength(200) name!: string;
  @ApiProperty() @IsString() @MaxLength(200) provider!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional({ example: { minCgpa: 7.5, programs: ['B.Tech'] } })
  @IsOptional()
  @IsObject()
  eligibility?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() eligibilityText?: string;
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) requiredDocuments!: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) amount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() deadline?: Date;
  @ApiPropertyOptional() @IsOptional() @IsUrl() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateScholarshipDto extends PartialType(CreateScholarshipDto) {}
export class ScholarshipQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ScholarshipType }) @IsOptional() @IsEnum(ScholarshipType) type?: ScholarshipType;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
