// димыч видео environments configuration 16 lesson
import { Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
    constructor(private configService: ConfigService) {}

    PORT: number = Number(this.configService.get('PORT'));
    ACCESS_TOKEN_SECRET: string = String(
        this.configService.get('ACCESS_TOKEN_SECRET'),
    );
    REFRESH_TOKEN_SECRET: string = String(
        this.configService.get('REFRESH_TOKEN_SECRET'),
    );
    ACCESS_TOKEN_LIFETIME: number = Number(
        this.configService.get('ACCESS_TOKEN_LIFETIME'),
    );
    REFRESH_TOKEN_LIFETIME: number = Number(
        this.configService.get('REFRESH_TOKEN_LIFETIME'),
    );
    MAIL_PORT: number = Number(this.configService.get('MAIL_PORT'));
    MAIL_HOST: string = String(this.configService.get('MAIL_HOST'));
    MAIL_LOGIN: string = String(this.configService.get('MAIL_LOGIN'));
    MAIL_PASS: string = String(this.configService.get('MAIL_PASS'));
    MONGO_URI: string = String(this.configService.get('MONGO_URI'));
    MONGO_URI_LOCAL: string = String(this.configService.get('MONGO_URI_LOCAL'));

    get IN_PRODUCTION(): boolean {
        // Защита от 'IN_PRODUCTION=false', которое через Boolean() даст true
        return this.configService.get('IN_PRODUCTION') === 'true';
    }
}
