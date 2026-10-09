import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({ description: 'User id of the other participant' }) @IsString() recipientUserId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(4000) message!: string;
}
export class SendMessageDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(4000) content!: string;
}
export class AnnouncementDto {
  @ApiProperty() @IsString() departmentId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(4000) content!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) title?: string;
}
