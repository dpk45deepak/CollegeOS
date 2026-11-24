import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateExamDto {
  @ApiProperty() @IsString() subjectOfferingId!: string;
  @ApiProperty({ enum: ExamType }) @IsEnum(ExamType) type!: ExamType;
  @ApiProperty() @IsString() @MaxLength(160) title!: string;
  @ApiProperty() @Type(() => Date) @IsDate() scheduledAt!: Date;
  @ApiProperty() @IsInt() @Min(5) @Max(600) durationMinutes!: number;
  @ApiProperty() @IsNumber() @Min(1) maxMarks!: number;
  @ApiProperty() @IsNumber() @Min(0) passMarks!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() roomId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gradingSchemeId?: string;
}
export class ResultEntryDto {
  @ApiProperty() @IsString() studentId!: string;
  @ApiProperty() @IsNumber() @Min(0) marksObtained!: number;
}
export class EnterResultsDto {
  @ApiProperty({ type: [ResultEntryDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ResultEntryDto)
  results!: ResultEntryDto[];
  @ApiPropertyOptional({ description: 'Required when changing already-published results' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  reason?: string;
}
export class BandDto {
  @ApiProperty() @IsNumber() min!: number;
  @ApiProperty() @IsNumber() max!: number;
  @ApiProperty() @IsString() grade!: string;
  @ApiProperty() @IsNumber() points!: number;
}
export class CreateGradingSchemeDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ type: [BandDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => BandDto) bands!: BandDto[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}
export class ExamListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  upcoming?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectOfferingId?: string;
}
