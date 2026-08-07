import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserAccessTokenContextDto } from '../dto/user-access-token-context.dto';
import { AppConfig } from '../../../../core/app.config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh-token',
) {
    constructor(appConfig: AppConfig) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return request?.cookies?.refreshToken ?? null;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: appConfig.REFRESH_TOKEN_SECRET,
        });
    }

    async validate(userData: UserAccessTokenContextDto): Promise<UserAccessTokenContextDto> {
        return userData;
    }
}
