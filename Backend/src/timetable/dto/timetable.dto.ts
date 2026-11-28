import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DayOfWeek, TimetableExceptionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateSlotDto {
  @ApiProperty() @IsString() subjectOfferingId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() roomId?: string;
  @ApiProperty({ enum: DayOfWeek }) @IsEnum(DayOfWeek) dayOfWeek!: DayOfWeek;
  @ApiProperty({ description: 'Minutes from midnight, e.g. 540 = 09:00' })
  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(1440) endMinute!: number;
  @ApiProperty() @Type(() => Date) @IsDate() validFrom!: Date;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() validTo?: Date;
}
export class UpdateSlotDto extends PartialType(CreateSlotDto) {
  @ApiPropertyOptional({ description: 'Reassign / substitute faculty for this subject offering (HOD/Admin)' })
  @IsOptional()
  @IsString()
  teacherId?: string;
}
export class AvailabilityDto {
  @ApiProperty({ enum: DayOfWeek }) @IsEnum(DayOfWeek) dayOfWeek!: DayOfWeek;
  @ApiProperty() @IsInt() @Min(0) @Max(1439) startMinute!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(1440) endMinute!: number;
}
export class CreateRoomDto {
  @ApiProperty() @IsString() campusId!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsInt() @Min(1) capacity!: number;
}
export class CreateTimetableExceptionDto {
  @ApiProperty() @IsString() slotId!: string;
  @ApiProperty() @Type(() => Date) @IsDate() date!: Date;
  @ApiProperty({ enum: TimetableExceptionType }) @IsEnum(TimetableExceptionType) type!: TimetableExceptionType;
  @ApiPropertyOptional() @IsOptional() @IsString() substituteTeacherId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() overrideRoomId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(1439) overrideStartMinute?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(1440) overrideEndMinute?: number;
  @ApiProperty() @IsString() @MinLength(3) reason!: string;
}
export class ExceptionQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() date?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() slotId?: string;
}
