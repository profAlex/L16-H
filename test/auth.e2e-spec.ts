import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import request from 'supertest';
import { EmailService } from '../src/modules/notifications/email.service';
import { User } from '../src/modules/user-accounts/domain/user.entity';

describe('UsersController and AuthController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const testingAppModule: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = testingAppModule.createNestApplication();
        appSetup(app); // не забываем подключить глобальные префиксы, пайпы
        await app.init();
    });

    afterAll(async () => {
        await request(app.getHttpServer()).delete('/testing/all-data');
        await app.close();
    });

    // Очищаем базу перед каждым тестом через специальный контроллер
    beforeEach(async () => {
        await request(app.getHttpServer()).delete('/testing/all-data');

        // мокаем возвращаемое значение
        // это нужно делать в блоке beforeEach, иначе шпион будет накапливать статистику вызовов
        // глобально внутри всего describe, и это будет сбивать логику проверок
        jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        ).mockResolvedValue(undefined);
    });

    afterEach(async () => {
        // jest.clearAllMocks(); // очищает только историю вызовов мока
        jest.restoreAllMocks(); // Полностью сбрасывает шпионов, созданных через jest.spyOn
    });

    it('POST /users and POST /auth/login - should return 201 and userview of a created user', async () => {
        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };
        const login = 'admin';
        const password = 'qwerty';
        const authHeader =
            'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');

        const createUserResponse = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', authHeader) // <--- УСТАНАВЛИВАЕМ ХЕДЕР ТУТ
            .send(user_1)
            .expect(201);

        // {
        //     "email": "example@example.dev",
        //     "login": "qwerty1",
        //     "id": "6a1c571c32d291a6d3598d47",
        //     "createdAt": "2026-05-31T15:43:24.658Z"
        // }

        expect(createUserResponse.body).toEqual({
            id: expect.any(String),
            login: user_1.login,
            email: user_1.email,
            createdAt: expect.any(String),
        });

        const createAuthLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ loginOrEmail: user_1.login, password: user_1.password })
            .expect(200);

        // {
        //     "accessToken" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMWM1YWM4ODdiNmFiNTlhYjg2ZDFmMiIsImlhdCI6MTc4MDI0MzE0NiwiZXhwIjoxNzgwMjQ2NzQ2fQ.jDyTdoIO-_KcGpM3pEQsDWvPLiME2TscR_7UK0H2-qk"
        // }
        // console.log("TEST_STOP: ", createAuthLoginResponse.body.accessToken.toString());

        expect(createAuthLoginResponse.body.accessToken).toBeDefined();
        expect(createAuthLoginResponse.body.accessToken).toEqual(
            expect.any(String),
        );

        // ==========================================
        // ПРОВЕРКА КУКИ REFRESH-ТОКЕНА
        // ==========================================

        // проверяем, что массив заголовков set-cookie вообще существует
        expect(createAuthLoginResponse.headers['set-cookie']).toBeDefined();

        // ищем нашу куку среди установленных кук
        const rawCookies = createAuthLoginResponse.headers['set-cookie'];

        // Превращаем в массив в любом случае (если это была строка, оборачиваем в массив)
        const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
        const refreshTokenCookie = cookies.find((cookie) =>
            cookie.includes('refreshToken'),
        );

        // кука с именем refreshToken была найдена
        expect(refreshTokenCookie).toBeDefined();

        // проверка флагов безопасности
        expect(refreshTokenCookie).toContain('refreshToken=');
        expect(refreshTokenCookie).toContain('HttpOnly');

        // expect(refreshTokenCookie).toContain('Secure');
    });

    it('POST /auth/registration - should return status 204 and create new user and send confirmation email with code', async () => {
        const sendConfirmationEmailSpy = jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        );

        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };

        const createUserResponse = await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_1)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmailSpy.mock.calls[0][0]).toBe(user_1.email);
    });

    it('POST /auth/registration - should return status 400 while trying to register user with same email', async () => {
        const sendConfirmationEmailSpy = jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        );

        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };

        const user_2 = {
            login: 'qwerty2',
            password: 'lg-988508_',
            email: 'example@example.dev',
        };

        const createUserResponse1 = await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_1)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmailSpy.mock.calls[0][0]).toBe(user_1.email);

        const createUserResponse2 = await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_2)
            .expect(400);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
    });

    it('POST /auth/registration-email-resending" - status 204, should send email with new code if user exists but not confirmed yet', async () => {
        const sendConfirmationEmailSpy = jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        );

        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };

        const user_1_resending = {
            email: 'example@example.dev',
        };

        const createUserResponse1 = await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_1)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmailSpy.mock.calls[0][0]).toBe(user_1.email);

        const createUserResponse2 = await request(app.getHttpServer())
            .post('/auth/registration-email-resending')
            .send(user_1_resending)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(2);
        expect(sendConfirmationEmailSpy.mock.calls[1][0]).toBe(user_1.email);
    });

    it('POST /auth/registration-confirmation - status 204, should confirm registration by email', async () => {
        const sendConfirmationEmailSpy = jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        );

        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };

        await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_1)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmailSpy.mock.calls[0][0]).toBe(user_1.email);
        expect(sendConfirmationEmailSpy.mock.calls[0][1]).toStrictEqual(
            expect.any(String),
        );

        const userConfirmationCode = {
            code: sendConfirmationEmailSpy.mock.calls[0][1],
        };

        console.log(userConfirmationCode.code);

        await request(app.getHttpServer())
            .post('/auth/registration-confirmation')
            .send(userConfirmationCode)
            .expect(204);

        // проверяем корректность изменения в базе через попытку логина
        await request(app.getHttpServer())
            .post('/auth/login') // или /auth/login, смотря какой у тебя эндпоинт
            .send({ loginOrEmail: user_1.login, password: user_1.password })
            .expect(200);
    });

    it('POST /auth/registration-confirmation - status 400, should return error if code already confirmed', async () => {
        const sendConfirmationEmailSpy = jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        );

        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };

        await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_1)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmailSpy.mock.calls[0][0]).toBe(user_1.email);
        expect(sendConfirmationEmailSpy.mock.calls[0][1]).toStrictEqual(
            expect.any(String),
        );

        const userConfirmationCode = {
            code: sendConfirmationEmailSpy.mock.calls[0][1],
        };

        console.log(userConfirmationCode.code);

        await request(app.getHttpServer())
            .post('/auth/registration-confirmation')
            .send(userConfirmationCode)
            .expect(204);

        // проверяем корректность изменения в базе через попытку логина
        await request(app.getHttpServer())
            .post('/auth/login') // или /auth/login, смотря какой у тебя эндпоинт
            .send({ loginOrEmail: user_1.login, password: user_1.password })
            .expect(200);

        // повторно пробуем запросить подтверждение
        await request(app.getHttpServer())
            .post('/auth/registration-confirmation')
            .send(userConfirmationCode)
            .expect(400);
    });

    it('POST /auth/registration-email-resending" - status 400, should return error if email already confirmed', async () => {
        const sendConfirmationEmailSpy = jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        );

        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };

        // регистрируем юзера
        await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_1)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmailSpy.mock.calls[0][0]).toBe(user_1.email);

        const userConfirmationCode = {
            code: sendConfirmationEmailSpy.mock.calls[0][1],
        };

        console.log(userConfirmationCode.code);

        // подтверждаем регистраци.ю кодом
        await request(app.getHttpServer())
            .post('/auth/registration-confirmation')
            .send(userConfirmationCode)
            .expect(204);

        const user_1_resending = {
            email: 'example@example.dev',
        };

        // пытаемся повторно выслать код после подтверждения
        await request(app.getHttpServer())
            .post('/auth/registration-email-resending')
            .send(user_1_resending)
            .expect(400);
    });

    it('POST /auth/registration-confirmation - status 400, should return error if code doesnt exist', async () => {
        const sendConfirmationEmailSpy = jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        );

        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };

        await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_1)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmailSpy.mock.calls[0][0]).toBe(user_1.email);
        expect(sendConfirmationEmailSpy.mock.calls[0][1]).toStrictEqual(
            expect.any(String),
        );

        const userConfirmationCode = {
            code: 'not existing code',
        };

        // console.log(userConfirmationCode.code);

        // пытаемся подтвердить емейл с неверным кодов регистрации
        await request(app.getHttpServer())
            .post('/auth/registration-confirmation')
            .send(userConfirmationCode)
            .expect(400);
    });

    it('POST /auth/registration-email-resending" - status 400, should return error if user email doesnt exist', async () => {
        const sendConfirmationEmailSpy = jest.spyOn(
            EmailService.prototype,
            'sendConfirmationEmail',
        );

        const user_1 = {
            login: 'qwerty1',
            password: 'lg-988508',
            email: 'example@example.dev',
        };

        // регистрируем юзера
        await request(app.getHttpServer())
            .post('/auth/registration')
            .send(user_1)
            .expect(204);

        expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmailSpy.mock.calls[0][0]).toBe(user_1.email);

        const user_1_resending = {
            email: 'non_existing@example.dev',
        };

        // пытаемся повторно выслать код после подтверждения, но с неверным епмейлом
        await request(app.getHttpServer())
            .post('/auth/registration-email-resending')
            .send(user_1_resending)
            .expect(400);
    });
});
