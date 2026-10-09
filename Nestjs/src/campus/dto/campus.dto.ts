import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoticeDto {
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiProperty() @IsString() @MaxLength(10000) body!: string;
  @ApiPropertyOptional({ description: 'Limit to one department; omit for college-wide' })
  @IsOptional()
  @IsString()
  departmentId?: string;
  @ApiPropertyOptional({ description: 'Limit to roles, e.g. ["STUDENT"]; omit for everyone' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audienceRoles?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) attachmentKeys?: string[];
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() expiresAt?: Date;
}
export class CreateClubDto {
  @ApiProperty() @IsString() @MaxLength(120) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
export class CreateEventDto {
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() venue?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clubId?: string;
  @ApiProperty() @Type(() => Date) @IsDate() startsAt!: Date;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() endsAt?: Date;
}
export class UpdateEventDto extends PartialType(CreateEventDto) {}
