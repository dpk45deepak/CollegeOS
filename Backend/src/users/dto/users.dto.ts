import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEmail, IsOptional, IsString, IsIn, Matches, MaxLength } from 'class-validator';
import { PASSWORD_RULE } from '../../auth/dto/auth.dto';
import { ROLE } from '../../auth/permissions';

const ASSIGNABLE = Object.values(ROLE).filter((r) => r !== ROLE.SUPER_ADMIN);

export class CreateUserDto {
  @ApiProperty() @IsString() @MaxLength(64) loginId!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MaxLength(80) firstName!: string;
  @ApiProperty() @IsString() @MaxLength(80) lastName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiProperty({ enum: ASSIGNABLE, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ASSIGNABLE, { each: true })
  roles!: string[];
  @ApiPropertyOptional({ description: 'Departments the roles are scoped to (e.g. HOD)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];
  @ApiPropertyOptional({ description: 'If omitted, the user receives a set-password email' })
  @IsOptional()
  @Matches(PASSWORD_RULE)
  initialPassword?: string;
}

export class AssignRolesDto {
  @ApiProperty({ enum: ASSIGNABLE, isArray: true }) @IsArray() @IsIn(ASSIGNABLE, { each: true }) roles!: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) departmentIds?: string[];
}
