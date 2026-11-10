// Backend/api/index.ts
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';

const server = express();
let isAppInitialized = false;

async function bootstrap() {
    if (!isAppInitialized) {
        const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server), {
            bufferLogs: true,
            rawBody: true,
        });

        const config = app.get(AppConfigService);
        app.useLogger(app.get(Logger));

        app.set('trust proxy', 1);
        app.use(helmet());
        app.use(express.json({ limit: '1mb' }));
        app.use(express.urlencoded({ limit: '1mb', extended: true }));

        app.enableCors({
            origin: config.corsOrigins.length ? config.corsOrigins : false,
            credentials: true,
            exposedHeaders: ['x-request-id'],
        });

        // NOTE: WebSockets (AppIoAdapter) cannot run on Vercel serverless functions

        app.setGlobalPrefix('api', { exclude: ['health', 'health/ready'] });
        app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: { enableImplicitConversion: false },
            }),
        );

        await app.init();
        isAppInitialized = true;
    }
    return server;
}

export default async function handler(req: Request, res: Response): Promise<void> {
    try {
        if (req.headers['x-matched-path'] && typeof req.headers['x-matched-path'] === 'string') {
            const originalPath = req.headers['x-matched-path'];
            if (originalPath && originalPath !== '/api') {
                const queryIdx = req.url.indexOf('?');
                const queryString = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
                req.url = `${originalPath}${queryString}`;
            }
        }
        await bootstrap();
        return new Promise<void>((resolve, reject) => {
            res.on('finish', resolve);
            res.on('close', resolve);
            res.on('error', reject);
            server(req, res);
        });
    } catch (err: unknown) {
        const error = err as Error;
        console.error('Fatal serverless bootstrap error:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Serverless Application Bootstrap Failure',
            error: error?.message || String(error),
        });
    }
}
