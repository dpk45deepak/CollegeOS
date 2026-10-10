import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { P } from '../../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../../common/decorators/auth.decorators';
import { Principal } from '../../common/types/principal';
import { RagAnswerService } from './rag-answer.service';
import { RetrievalService } from './retrieval.service';

class AskDto {
  @ApiProperty({ example: 'What is the minimum attendance required to sit exams?' })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  question!: string;
  @ApiPropertyOptional({ enum: DocumentType }) @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
  @ApiPropertyOptional({ example: '2025-26' }) @IsOptional() @IsString() academicYear?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(16) semesterNumber?: number;
}

@ApiTags('AI · Knowledge')
@ApiBearerAuth()
@Controller('ai/knowledge')
export class RagController {
  constructor(
    private readonly answers: RagAnswerService,
    private readonly retrieval: RetrievalService,
  ) {}

  @Post('ask')
  @HttpCode(200)
  @RequirePermissions(P.AI_CHAT)
  @ApiOperation({
    summary: 'Ask the college knowledge base',
    description:
      'Permission-aware RAG: only documents the caller may read are retrieved. Answers carry source citations; if the knowledge base lacks the answer the assistant says so instead of guessing.',
  })
  ask(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: AskDto) {
    return this.answers.answer(u, t, dto.question, {
      filters: { documentType: dto.documentType, academicYear: dto.academicYear, semesterNumber: dto.semesterNumber },
    });
  }

  @Post('search')
  @HttpCode(200)
  @RequirePermissions(P.AI_CHAT)
  @ApiOperation({ summary: 'Retrieval only (no LLM): ranked passages with sources' })
  async search(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: AskDto) {
    const r = await this.retrieval.retrieve(u, t, dto.question, {
      documentType: dto.documentType,
      academicYear: dto.academicYear,
      semesterNumber: dto.semesterNumber,
    });
    return {
      relevant: r.relevant,
      usedVector: r.usedVector,
      results: r.chunks.map((c) => ({
        chunkId: c.id,
        documentId: c.documentId,
        title: c.title,
        page: c.pageNumber,
        relevance: Number(c.relevance.toFixed(3)),
        excerpt: c.content.slice(0, 400),
      })),
    };
  }
}
