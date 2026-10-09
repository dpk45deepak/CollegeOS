import { Module } from '@nestjs/common';
import { VectorStoreService } from './embeddings/vector-store.service';
import { DocumentProcessor, EmbeddingProcessor } from './document-processing/document-processor';

@Module({ providers: [VectorStoreService, DocumentProcessor, EmbeddingProcessor], exports: [VectorStoreService] })
export class AiPipelineModule {}
