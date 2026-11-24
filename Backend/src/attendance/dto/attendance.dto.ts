import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus, CorrectionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class AttendanceRecordDto {
  @ApiProperty() @IsString() studentId!: string;
  @ApiProperty({ enum: AttendanceStatus }) @IsEnum(AttendanceStatus) status!: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) remark?: string;
}

export class MarkAttendanceDto {
  @ApiProperty() @IsString() subjectOfferingId!: string;
  @ApiProperty({ example: '2026-10-08' }) @Type(() => Date) @IsDate() date!: Date;
  @ApiPropertyOptional({ description: 'PER_LECTURE: the timetable slot being taught' })
  @IsOptional()
  @IsString()
  timetableSlotId?: string;
  @ApiPropertyOptional({ description: 'CUSTOM mode label, or PER_LECTURE without a slot (e.g. "P3")' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  periodKey?: string;
  @ApiPropertyOptional({
    enum: AttendanceStatus,
    description: 'Section marking: applied to every enrolled student not listed in `records`',
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  defaultStatus?: AttendanceStatus;
  @ApiProperty({ type: [AttendanceRecordDto], description: 'Individual or bulk exceptions' })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records!: AttendanceRecordDto[];
}

export class CorrectionRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() attendanceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectOfferingId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() date?: Date;
  @ApiProperty({ enum: AttendanceStatus }) @IsEnum(AttendanceStatus) newStatus!: AttendanceStatus;
  @ApiProperty({ minLength: 10 }) @IsString() @MinLength(10) @MaxLength(500) reason!: string;
}

export class ReviewCorrectionDto {
  @ApiProperty() @IsBoolean() approve!: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class CorrectionListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CorrectionStatus }) @IsOptional() @IsEnum(CorrectionStatus) status?: CorrectionStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() studentId?: string;
}

export class ScheduledSessionsQueryDto {
  @ApiPropertyOptional({ example: '2026-11-24' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;
}

export class SessionRosterQueryDto {
  @ApiPropertyOptional({ example: '2026-11-24' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;
}

export class AttendanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() subjectId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() from?: Date;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() to?: Date;
}
