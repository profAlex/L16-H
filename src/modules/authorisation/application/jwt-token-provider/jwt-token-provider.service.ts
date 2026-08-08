import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../../../core/app.config';
import { JwtService } from '@nestjs/jwt';

export type JwtPayload = {
    userId: string;
    deviceUUID: string;
};

@Injectable()
export class JwtTokenProvider {
    constructor(
        private readonly jwtService: JwtService,
        private readonly appConfig: AppConfig,
    ) {}

    async generatePairOfTokens(payload: JwtPayload) {
        const accessToken = await this.jwtService.signAsync(
            { userId: payload.userId },
            {
                secret: this.appConfig.ACCESS_TOKEN_SECRET,
                expiresIn: this.appConfig.ACCESS_TOKEN_LIFETIME,
            },
        );

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.appConfig.REFRESH_TOKEN_SECRET,
            expiresIn: this.appConfig.REFRESH_TOKEN_LIFETIME,
        });

        return { accessToken, refreshToken };
    }
}
