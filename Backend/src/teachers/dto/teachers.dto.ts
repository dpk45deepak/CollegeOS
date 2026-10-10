import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PASSWORD_RULE } from '../../auth/dto/auth.dto';

export class CreateTeacherDto {
  @ApiProperty() @IsString() @MaxLength(64) employeeId!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MaxLength(80) firstName!: string;
  @ApiProperty() @IsString() @MaxLength(80) lastName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() departmentId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() designation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() qualifications?: string;
  @ApiPropertyOptional({ description: 'Also grant HOD role scoped to the department' })
  @IsOptional()
  @IsBoolean()
  isHod?: boolean;
  @ApiPropertyOptional() @IsOptional() @Matches(PASSWORD_RULE) initialPassword?: string;
}

export class CreateOfferingDto {
  @ApiProperty() @IsString() subjectId!: string;
  @ApiProperty() @IsString() semesterId!: string;
  @ApiProperty() @IsString() sectionId!: string;
  @ApiProperty() @IsString() teacherId!: string;
  @ApiPropertyOptional({ description: 'Enrol every student of the section immediately', default: true })
  @IsOptional()
  @IsBoolean()
  enrollSection?: boolean;
}

export class EnrollDto {
  @ApiProperty() @IsArray() @ArrayNotEmpty() @ArrayMaxSize(500) @IsString({ each: true }) studentIds!: string[];
}

export class LeaveRequestDto {
  @ApiProperty() @Type(() => Date) @IsDate() fromDate!: Date;
  @ApiProperty() @Type(() => Date) @IsDate() toDate!: Date;
  @ApiProperty() @IsString() @MaxLength(500) reason!: string;
}
