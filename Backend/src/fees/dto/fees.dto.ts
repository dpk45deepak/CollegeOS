import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class FeeComponentDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsNumber() @Min(0) amount!: number;
}
export class CreateFeeStructureDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ example: '2026-27' }) @IsString() academicYear!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() programId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() batchId?: string;
  @ApiProperty({ type: [FeeComponentDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FeeComponentDto)
  components!: FeeComponentDto[];
}
export class AssignFeeDto {
  @ApiPropertyOptional() @IsOptional() @IsArray() @ArrayMaxSize(1000) @IsString({ each: true }) studentIds?: string[];
  @ApiPropertyOptional({ description: 'Assign to every student of this batch' })
  @IsOptional()
  @IsString()
  batchId?: string;
  @ApiProperty() @Type(() => Date) @IsDate() dueDate!: Date;
}
export class AdjustFeeDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) discount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) scholarshipAdjustment?: number;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(300) reason!: string;
}
export class StartPaymentDto {
  @ApiProperty({ example: 'mock' }) @IsString() gateway!: string;
  @ApiPropertyOptional({ description: 'Defaults to the full outstanding amount' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}
export class ManualPaymentDto {
  @ApiProperty() @IsNumber() @Min(1) amount!: number;
  @ApiProperty({ example: 'cash' }) @IsString() mode!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}
export class RefundDto {
  @ApiProperty() @IsNumber() @Min(1) amount!: number;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(300) reason!: string;
}
export class FeeListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FeeStatus }) @IsOptional() @IsEnum(FeeStatus) status?: FeeStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() studentId?: string;
}
export class CompleteMockPaymentDto {
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() succeed?: boolean;
}
