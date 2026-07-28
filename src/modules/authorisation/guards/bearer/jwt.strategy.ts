import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserContextDto } from '../dto/user-context.dto';
import { envConfig } from '../../../../config_old';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET')?.trim() ?? 'fallback_secret_key',
            // secretOrKey: envConfig.accessTokenSecret, //TODO: move to env. will be in the following lessons
        })
    }

    async validate(userData: UserContextDto): Promise<UserContextDto> {
        return userData;
    }
}
