import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {DomainException} from "../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../core/exceptions/domain-exception-codes";

// 1. Берем класс напрямую через require, чтобы обойти кривой импорт модулей
const BasicStrategyClass = require('passport-http').Strategy;

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(
    // 2. Принудительно приводим к any, чтобы убрать ошибку TS2345 про "missing properties apply, call..."
    BasicStrategyClass as any,
    'basic'
) {
    constructor() {
        super();
    }

    // 3. Здесь типизация работает идеально: Passport передаст чистые строки из заголовка
    async validate(username: string, password: string): Promise<boolean> {
        const adminUser = 'admin';
        const adminPass = 'qwerty'; // В проде лучше юзать process.env.BASIC_AUTH_PASS

        if (username !== adminUser || password !== adminPass) {
            // throw new UnauthorizedException('Invalid basic auth credentials');
            throw new DomainException({
                code: DomainExceptionCode.Unauthorized,
                message: 'Invalid basic auth credentials!',
            });
        }

        return true; // юзер успешно авторизован, в req.user запишется true
    }
}