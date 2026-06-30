import {Module} from "@nestjs/common";
import {MailerModule} from "@nestjs-modules/mailer";
import {envConfig} from "../../config";
import {EmailService} from "./email.service";

@Module({
    imports: [
        MailerModule.forRoot({
            //transport: `smtps://${envConfig.mailLogin}:${envConfig.mailPass}@${envConfig.mailHost}`,
            transport: {
                host: envConfig.mailHost,     // smtp.yandex.ru
                port: Number(envConfig.mailPort), // 465 (обязательно числом!)
                secure: true,                 // true для порта 465 (SSL)
                auth: {
                    user: envConfig.mailLogin, // geniusb198
                    pass: envConfig.mailPass,  // ТУТ ДОЛЖЕН БЫТЬ ПАРОЛЬ ПРИЛОЖЕНИЯ
                },
                tls: { rejectUnauthorized: false },
            },
            defaults: {
                from: '"test-notification" <geniusb198@yandex.ru>',
                subject: 'Подтверждение регистрации',
            }
        })
    ],
    providers: [EmailService],
    exports: [EmailService],
})
export class NotificationsModule {}