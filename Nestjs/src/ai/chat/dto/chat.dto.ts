import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChatDto {
  @ApiProperty({ example: 'How much attendance do I have?' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
  @ApiPropertyOptional({ description: 'Continue an existing conversation' })
  @IsOptional()
  @IsString()
  conversationId?: string;
  @ApiPropertyOptional({ description: 'Parents: which ward the question is about' })
  @IsOptional()
  @IsString()
  studentId?: string;
}
