import {Injectable} from "@nestjs/common";
import {MailerService} from "@nestjs-modules/mailer";

@Injectable()
export class EmailService {
    constructor(private mailerService: MailerService) {}

    async sendConfirmationEmail(email: string, code: string): Promise<void> {
        //can add html templates, implement advertising and other logic for mailing...
        await this.mailerService.sendMail({
            subject: `finish registration`,
            to: email,
            text: `finish registration via link https://somesite.com/confirm-registration?code=${code}`,
            html: `<h1>Registration completion</h1>
        <p>To finish registration please follow the link below:
            <a href="https://somesite.com/confirm-registration?code=${code}">complete registration</a>
        </p>`,
        });
    }

    // async sendConfirmationEmail(email: string, code: string): Promise<void> {
    //     try {
    //         await this.mailerService.sendMail({
    //             text: `confirm registration via link https://somesite.com/confirm-registration?code=${code}`,
    //             to: email,
    //         });
    //         console.log("=== ПИСЬМО УСПЕШНО ОТПРАВЛЕНО ===");
    //     } catch (error) {
    //         console.error("!!! ОШИБКА ОТПРАВКИ ПОЧТЫ !!!");
    //         console.error(error);
    //     }
    // }

    async sendRecoveryEmail(email: string, code: string): Promise<void> {
        await this.mailerService.sendMail({
            subject: `password recovery`,
            to: email,
            text: `confirm password recovery via link https://somesite.com/password-recovery?code=${code}`,
            html: `<h1>Password recovery</h1>
        <p>To confirm password recovery please follow the link below:
            <a href="https://somesite.com/password-recovery?code=${code}">recovery password</a>
        </p>`
        });
    }
}