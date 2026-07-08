import { ConfigModule } from '@nestjs/config';

export const configModule = ConfigModule.forRoot({
    envFilePath: [
        process.env.ENV_FILE_PATH?.trim(),
        '.env.development',
        '.env.production',
    ],
});
