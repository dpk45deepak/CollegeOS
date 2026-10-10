import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
