import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import cookieParser from 'cookie-parser';
import { AppConfig } from './core/app.config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());
    appSetup(app); //глобальные настройки приложения

    const appConfig = app.get<AppConfig>(AppConfig); //это способ получить доступ к классу хранящему значения наших переменных окружения

    const PORT = appConfig.PORT || 5005; //TODO: move to configService. will be in the following lessons
    const IN_PRODUCTION = appConfig.IN_PRODUCTION;
    await app.listen(PORT, () => {
        console.log('Server is running on port ' + PORT);
    });
}

bootstrap();
