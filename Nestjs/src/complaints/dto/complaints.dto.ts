import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintCategory, ComplaintStatus, Priority } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateComplaintDto {
  @ApiPropertyOptional({ enum: ComplaintCategory, description: 'Omit to auto-classify' })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(160) subject!: string;
  @ApiProperty() @IsString() @MinLength(10) @MaxLength(5000) description!: string;
  @ApiPropertyOptional({ enum: Priority }) @IsOptional() @IsEnum(Priority) priority?: Priority;
}
export class RoutePreviewDto {
  @ApiProperty({ example: "My scholarship hasn't been credited" })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  text!: string;
}
export class ChangeStatusDto {
  @ApiProperty({ enum: ComplaintStatus }) @IsEnum(ComplaintStatus) status!: ComplaintStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) note?: string;
}
export class AssignComplaintDto {
  @ApiProperty() @IsString() userId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
export class CommentDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) note!: string;
  @ApiPropertyOptional({ description: 'Internal notes are hidden from the student' }) @IsOptional() internal?: boolean;
}
export class FeedbackDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) rating!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) comment?: string;
  @ApiPropertyOptional({ description: 'Not satisfied → reopen' }) @IsOptional() reopen?: boolean;
}
export class ComplaintQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ComplaintStatus }) @IsOptional() @IsEnum(ComplaintStatus) status?: ComplaintStatus;
  @ApiPropertyOptional({ enum: Priority }) @IsOptional() @IsEnum(Priority) priority?: Priority;
  @ApiPropertyOptional({ enum: ComplaintCategory })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;
}
