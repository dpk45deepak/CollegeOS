import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AttendanceMode } from '@prisma/client';
import { IsEnum } from 'class-validator';

const CODE = /^[A-Za-z0-9_.-]{1,32}$/;

export class CreateCampusDto {
  @ApiProperty() @Matches(CODE) code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) address?: string;
}
export class UpdateCampusDto extends PartialType(CreateCampusDto) {}

export class CreateDepartmentDto {
  @ApiProperty({ example: 'CSE' }) @Matches(CODE) code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() campusId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hodUserId?: string;
}
export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class CreateProgramDto {
  @ApiProperty({ example: 'B.Tech' }) @Matches(CODE) code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(16) durationSemesters!: number;
}
export class UpdateProgramDto extends PartialType(CreateProgramDto) {}

export class CreateBatchDto {
  @ApiProperty() @IsString() programId!: string;
  @ApiProperty() @IsString() departmentId!: string;
  @ApiProperty() @IsInt() @Min(1990) @Max(2100) startYear!: number;
  @ApiProperty() @IsInt() @Min(1990) @Max(2100) endYear!: number;
  @ApiProperty({ example: '2023-2027' }) @IsString() @IsNotEmpty() name!: string;
}

export class CreateSemesterDto {
  @ApiProperty() @IsString() batchId!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(16) number!: number;
  @ApiProperty({ example: '2026-27' }) @IsString() academicYear!: string;
  @ApiProperty() @Type(() => Date) @IsDate() startDate!: Date;
  @ApiProperty() @Type(() => Date) @IsDate() endDate!: Date;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCurrent?: boolean;
}
export class UpdateSemesterDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(16) number?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() academicYear?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() startDate?: Date;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() endDate?: Date;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCurrent?: boolean;
}

export class CreateSectionDto {
  @ApiProperty() @IsString() semesterId!: string;
  @ApiProperty({ example: 'A' }) @IsString() @IsNotEmpty() @MaxLength(16) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) capacity?: number;
}
export class UpdateSectionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(16) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) capacity?: number;
}

export class CreateSubjectDto {
  @ApiProperty() @IsString() departmentId!: string;
  @ApiProperty({ example: 'CS301' }) @Matches(CODE) code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiPropertyOptional({ default: 3 }) @IsOptional() @IsInt() @Min(0) @Max(30) credits?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(16) semesterNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isElective?: boolean;
}
export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}

export class CreateCollegeDto {
  @ApiProperty({ example: 'SDCET' }) @Matches(CODE) code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty() @IsString() adminLoginId!: string;
  @ApiProperty() @IsString() adminEmail!: string;
  @ApiProperty() @IsString() @MaxLength(128) adminPassword!: string;
}

export class UpdateCollegeSettingsDto {
  @ApiPropertyOptional({ enum: AttendanceMode }) @IsOptional() @IsEnum(AttendanceMode) attendanceMode?: AttendanceMode;
  @ApiPropertyOptional({ example: 75 }) @IsOptional() @IsNumber() @Min(1) @Max(100) attendanceThreshold?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
}
