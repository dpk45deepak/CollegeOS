import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength, validateSync } from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}
export enum AiProviderName {
  OpenAI = 'openai',
  Gemini = 'gemini',
  OpenRouter = 'openrouter',
  Local = 'local',
}
export enum StorageDriver {
  Local = 'local',
  S3 = 's3',
  R2 = 'r2',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv) NODE_ENV: NodeEnv = NodeEnv.Development;
  @Type(() => Number) @IsInt() @Min(1) @Max(65535) PORT = 3000;
  @IsString() LOG_LEVEL = 'info';
  @IsString() CORS_ORIGINS = '';

  @IsString() @MinLength(1) DATABASE_URL!: string;
  @IsString() @MinLength(1) REDIS_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters' })
  JWT_SECRET!: string;
  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' })
  JWT_REFRESH_SECRET!: string;
  @IsString() JWT_ACCESS_TTL = '15m';
  @IsString() JWT_REFRESH_TTL = '7d';

  @Type(() => Number) @IsInt() @Min(1) THROTTLE_TTL_SECONDS = 60;
  @Type(() => Number) @IsInt() @Min(1) THROTTLE_LIMIT = 120;

  @IsEnum(AiProviderName) AI_PROVIDER: AiProviderName = AiProviderName.OpenAI;
  @IsOptional() @IsString() AI_BASE_URL?: string;
  @IsOptional() @IsString() AI_CHAT_MODEL?: string;
  @IsOptional() @IsString() AI_EMBEDDING_MODEL?: string;
  @Type(() => Number) @IsInt() @Min(1) AI_EMBEDDING_DIMENSIONS = 1536;
  @IsOptional() @IsString() OPENAI_API_KEY?: string;
  @IsOptional() @IsString() GEMINI_API_KEY?: string;
  @IsOptional() @IsString() OPENROUTER_API_KEY?: string;

  @IsOptional() @IsString() SMTP_URL?: string;
  @IsString() MAIL_FROM = 'College OS <no-reply@college.local>';
  @IsString() APP_URL = 'http://localhost:5173';
  @IsOptional() @IsString() WHATSAPP_API_URL?: string;
  @IsOptional() @IsString() WHATSAPP_API_TOKEN?: string;
  @IsOptional() @IsString() PUSH_PROVIDER_KEY?: string;
  @IsOptional() @IsString() PUSH_APP_ID?: string;
  @IsOptional() @IsString() PUSH_API_URL?: string;
  @Type(() => Number) @IsInt() @Min(1) MAX_UPLOAD_MB = 20;
  @IsOptional() @IsString() SEED_PASSWORD?: string;
  @IsOptional() @IsString() AI_RERANK_MODEL?: string;

  // Optional payment gateways & malware scanner overrides
  @IsOptional() @IsString() PAYMENT_GATEWAY?: string;
  @IsOptional() @IsString() ENABLE_MOCK_GATEWAY?: string;
  @IsOptional() @IsString() RAZORPAY_KEY_ID?: string;
  @IsOptional() @IsString() RAZORPAY_KEY_SECRET?: string;
  @IsOptional() @IsString() RAZORPAY_WEBHOOK_SECRET?: string;
  @IsOptional() @IsString() STRIPE_SECRET_KEY?: string;
  @IsOptional() @IsString() STRIPE_WEBHOOK_SECRET?: string;
  @IsOptional() @IsString() CLAMAV_URL?: string;
  @IsOptional() @IsString() ALLOW_NOOP_SCANNER?: string;

  @IsEnum(StorageDriver) STORAGE_DRIVER: StorageDriver = StorageDriver.Local;
  @IsString() STORAGE_LOCAL_PATH = './uploads-dev';
  @IsOptional() @IsString() S3_BUCKET?: string;
  @IsOptional() @IsString() S3_REGION?: string;
  @IsOptional() @IsString() S3_ENDPOINT?: string;
  @IsOptional() @IsString() S3_ACCESS_KEY?: string;
  @IsOptional() @IsString() S3_SECRET_KEY?: string;
}

/** Fails fast at boot with a readable list of every invalid variable. */
export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  // Empty strings (as in .env.example) count as "unset" so defaults/optional rules apply.
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== ''));
  const config = plainToInstance(EnvironmentVariables, cleaned);
  const errors = validateSync(config);
  if (errors.length > 0) {
    const lines = errors.map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  if (config.NODE_ENV === NodeEnv.Production && config.CORS_ORIGINS.trim() === '') {
    throw new Error('Invalid environment configuration:\n  - CORS_ORIGINS: required in production');
  }
  return config;
}
