import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class RubricItemDto {
  @ApiProperty() @IsString() @MaxLength(120) criterion!: string;
  @ApiProperty() @IsNumber() @Min(0) maxMarks!: number;
}
export class CreateAssignmentDto {
  @ApiProperty() @IsString() subjectOfferingId!: string;
  @ApiProperty() @IsString() @MaxLength(160) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiProperty() @Type(() => Date) @IsDate() dueAt!: Date;
  @ApiProperty() @IsNumber() @Min(1) maxMarks!: number;
  @ApiPropertyOptional({ type: [RubricItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RubricItemDto)
  rubric?: RubricItemDto[];
  @ApiPropertyOptional({ description: 'Keys returned by POST /files/attachments' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  attachmentKeys?: string[];
}
export class SubmitDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10000) text?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) fileKeys?: string[];
}
export class GradeDto {
  @ApiProperty() @IsNumber() @Min(0) marks!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) feedback?: string;
}
export class AssignmentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() subjectOfferingId?: string;
  @ApiPropertyOptional({ description: 'only items not yet submitted (students)' })
  @IsOptional()
  @IsString()
  pending?: string;
}
