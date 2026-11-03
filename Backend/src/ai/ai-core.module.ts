import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { AiProviderName } from '../config/env.validation';
import { AiClient } from './ai-client.service';
import { LLM_PROVIDER, LlmProvider } from './providers/llm.provider';
import { OpenAiCompatProvider, PROVIDER_DEFAULTS } from './providers/openai-compat.provider';

@Global()
@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [AppConfigService],
      useFactory: (c: AppConfigService): LlmProvider => {
        const name = c.get('AI_PROVIDER');
        const d = PROVIDER_DEFAULTS[name];
        const apiKey = {
          [AiProviderName.OpenAI]: c.get('OPENAI_API_KEY'),
          [AiProviderName.Gemini]: c.get('GEMINI_API_KEY'),
          [AiProviderName.OpenRouter]: c.get('OPENROUTER_API_KEY'),
          [AiProviderName.Local]: undefined,
        }[name];
        let baseUrl = (c.get('AI_BASE_URL') || d.baseUrl).trim().replace(/\/+$/, '');
        if (name === AiProviderName.Gemini && !baseUrl.includes('/openai')) {
          baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
        }
        let chatModel = (c.get('AI_CHAT_MODEL') || d.chatModel).trim();
        if (name === AiProviderName.Gemini) {
          if (!chatModel || chatModel.includes('2.0') || chatModel.includes('2.5') || chatModel.includes('3.8')) {
            chatModel = 'gemini-3.5-flash';
          }
        }
        let embeddingModel = (c.get('AI_EMBEDDING_MODEL') || d.embeddingModel).trim();
        if (name === AiProviderName.Gemini) {
          if (!embeddingModel || embeddingModel.includes('text-embedding-004')) {
            embeddingModel = 'gemini-embedding-2';
          }
        }
        return new OpenAiCompatProvider({
          name,
          baseUrl,
          apiKey,
          chatModel,
          embeddingModel,
          requiresKey: d.requiresKey,
          extraHeaders: name === AiProviderName.OpenRouter ? { 'X-Title': 'College OS' } : undefined,
        });
      },
    },
    AiClient,
  ],
  exports: [AiClient],
})
export class AiCoreModule {}
