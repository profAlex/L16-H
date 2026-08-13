import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        // 1. Извлекаем IP
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

        // 2. Извлекаем URL
        const url = req.originalUrl || req.url;

        // 3. Извлекаем deviceName (User-Agent)
        // В Express заголовки приходят в нижнем регистре (lowercase)
        const deviceName = req.headers?.['user-agent'] || 'unknown-device';

        // Формируем составной ключ: IP + URL + User-Agent
        return `${ip}-${url}-${deviceName}`;
    }
}