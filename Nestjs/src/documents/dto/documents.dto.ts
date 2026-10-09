import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus, DocumentType, DocumentVisibility } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class UploadDocumentDto {
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiProperty({ enum: DocumentType }) @IsEnum(DocumentType) documentType!: DocumentType;
  @ApiPropertyOptional({
    enum: DocumentVisibility,
    default: 'ADMIN_ONLY',
    description: 'Defaults to the most restrictive level',
  })
  @IsOptional()
  @IsEnum(DocumentVisibility)
  visibility?: DocumentVisibility;
  @ApiPropertyOptional({ description: 'Required for DEPARTMENT visibility' })
  @IsOptional()
  @IsString()
  departmentId?: string;
  @ApiPropertyOptional({ type: [String], description: 'Required for ROLE_RESTRICTED' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(11)
  @IsString({ each: true })
  allowedRoleKeys?: string[];
  @ApiPropertyOptional({ example: '2025-26' }) @IsOptional() @IsString() @MaxLength(16) academicYear?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(16) semesterNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectId?: string;
}
export class UpdateVisibilityDto {
  @ApiProperty({ enum: DocumentVisibility }) @IsEnum(DocumentVisibility) visibility!: DocumentVisibility;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedRoleKeys?: string[];
}
export class DocumentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DocumentType }) @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
  @ApiPropertyOptional({ enum: DocumentStatus }) @IsOptional() @IsEnum(DocumentStatus) status?: DocumentStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
