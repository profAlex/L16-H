import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import request from 'supertest';
import { EmailService } from '../src/modules/notifications/email.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('SecurityDevicesController (e2e)', () => {
    let app: INestApplication;
    let sendConfirmationEmailSpy: jest.SpyInstance;

    beforeAll(async () => {
        const testingAppModule: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // .overrideGuard(ThrottlerGuard)
            // .useValue({
            //     // Разрешаем абсолютно все запросы в тестах
            //     canActivate: (context: ExecutionContext) => true,
            // })
            .compile();

        app = testingAppModule.createNestApplication();
        appSetup(app);
        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await request(app.getHttpServer()).delete('/testing/all-data');
            await app.close();
        }
    });

    beforeEach(async () => {
        await request(app.getHttpServer()).delete('/testing/all-data');

        // Создаем шпион И подменяем его реализацию в одном месте
        sendConfirmationEmailSpy = jest
            .spyOn(EmailService.prototype, 'sendConfirmationEmail')
            .mockImplementation(async () => Promise.resolve());
    });

    afterEach(async () => {
        jest.restoreAllMocks();
    });

    it('GET /security/devices - should return 200 and an array of DeviceViewModel', async () => {
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
            .set('Authorization', authHeader)
            .send(user_1)
            .expect(201);

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

        expect(createAuthLoginResponse.body.accessToken).toBeDefined();
        expect(createAuthLoginResponse.body.accessToken).toEqual(
            expect.any(String),
        );

        expect(createAuthLoginResponse.headers['set-cookie']).toBeDefined();

        const rawCookies = createAuthLoginResponse.headers['set-cookie'];
        const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
        const refreshTokenCookie = cookies.find((cookie) =>
            cookie.includes('refreshToken'),
        );

        expect(refreshTokenCookie).toBeDefined();
        expect(refreshTokenCookie).toContain('refreshToken=');
        expect(refreshTokenCookie).toContain('HttpOnly');

        // const cleanCookie = refreshTokenCookie.split(';')[0];

        // запрос на эндпоинт /security/devices с передачей куки
        const devicesResponse = await request(app.getHttpServer())
            .get('/security/devices')
            .set('Cookie', refreshTokenCookie)
            .expect(200);


        // Проверяем, что в теле пришел массив устройств
        expect(Array.isArray(devicesResponse.body)).toBe(true);
        expect(devicesResponse.body).toHaveLength(1);

        // Проверяем структуру элементов массива (DeviceViewModel)
        expect(devicesResponse.body[0]).toEqual({
            ip: expect.any(String),
            title: expect.any(String), // User-Agent / deviceName
            lastActiveDate: expect.any(String),
            deviceId: expect.any(String),
        });
    });


    it('GET /security/devices - multiple devices logged in from single user, should return 200 and an array of DeviceViewModel', async () => {
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
            .set('Authorization', authHeader)
            .send(user_1)
            .expect(201);

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

        expect(createAuthLoginResponse.body.accessToken).toBeDefined();
        expect(createAuthLoginResponse.body.accessToken).toEqual(
            expect.any(String),
        );

        expect(createAuthLoginResponse.headers['set-cookie']).toBeDefined();

        const rawCookies = createAuthLoginResponse.headers['set-cookie'];
        const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
        const refreshTokenCookie = cookies.find((cookie) =>
            cookie.includes('refreshToken'),
        );

        expect(refreshTokenCookie).toBeDefined();
        expect(refreshTokenCookie).toContain('refreshToken=');
        expect(refreshTokenCookie).toContain('HttpOnly');


        // логиним юзера второй раз
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const createAuthLoginResponse1 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ loginOrEmail: user_1.login, password: user_1.password })
            .expect(200);

        expect(createAuthLoginResponse1.body.accessToken).toBeDefined();
        expect(createAuthLoginResponse1.body.accessToken).toEqual(
            expect.any(String),
        );

        expect(createAuthLoginResponse1.headers['set-cookie']).toBeDefined();

        // const rawCookies1 = createAuthLoginResponse1.headers['set-cookie'];
        // const cookies1 = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
        // const refreshTokenCookie1 = cookies.find((cookie) =>
        //     cookie.includes('refreshToken'),
        // );





        // const cleanCookie = refreshTokenCookie.split(';')[0];

        // запрос на эндпоинт /security/devices с передачей куки
        const devicesResponse = await request(app.getHttpServer())
            .get('/security/devices')
            .set('Cookie', refreshTokenCookie)
            .expect(200);


        // Проверяем, что в теле пришел массив устройств
        expect(Array.isArray(devicesResponse.body)).toBe(true);
        expect(devicesResponse.body).toHaveLength(2);

        // Проверяем структуру элементов массива (DeviceViewModel)
        expect(devicesResponse.body[0]).toEqual({
            ip: expect.any(String),
            title: expect.any(String), // User-Agent / deviceName
            lastActiveDate: expect.any(String),
            deviceId: expect.any(String),
        });
    });
});