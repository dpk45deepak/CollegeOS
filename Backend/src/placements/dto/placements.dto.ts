import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewMode, JobApplicationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateCompanyDto {
  @ApiProperty() @IsString() @MaxLength(160) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() industry?: string;
}
export class CreateJobDto {
  @ApiProperty() @IsString() companyId!: string;
  @ApiProperty() @IsString() @MaxLength(160) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) requiredSkills!: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) minCgpa?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) maxBacklogs?: number;
  @ApiPropertyOptional({ description: 'Department ids; empty = all' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDepartments?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) ctc?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() deadline?: Date;
}
export class CreateDriveDto {
  @ApiProperty() @IsString() jobId!: string;
  @ApiProperty() @Type(() => Date) @IsDate() driveDate!: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() venue?: string;
}
export class UpdateApplicationDto {
  @ApiProperty({ enum: JobApplicationStatus }) @IsEnum(JobApplicationStatus) status!: JobApplicationStatus;
}
export class ScheduleInterviewDto {
  @ApiProperty() @Type(() => Date) @IsDate() scheduledAt!: Date;
  @ApiProperty({ enum: InterviewMode }) @IsEnum(InterviewMode) mode!: InterviewMode;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) round?: number;
}
export class IssueOfferDto {
  @ApiProperty() @IsNumber() @Min(0) ctc!: number;
}
export class JobQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
