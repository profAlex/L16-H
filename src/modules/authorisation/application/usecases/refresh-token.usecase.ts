import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Session, SessionModelType } from '../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { SessionsCommandRepository } from '../../infrastructure/session/sessions.command-repository';
import { JwtTokenProvider } from '../jwt-token-provider/jwt-token-provider.service';
import { Response, Request } from 'express';
import { TokensPair } from './login-user.usecase';
import { UnauthorizedException } from '@nestjs/common';

// export type TokensPair = {
//     accessToken: string;
//     refreshToken: string;
// };

// логиним юзера: а именно - создаем пару токенов и создаем сессию для этого юзера, возвращаем токены
export class RefreshToken extends Command<TokensPair> {
    constructor(
        public readonly payload: {
            userId: string;
            deviceUUID: string;
            sessionId: string;
            issuedAt: Date;
            expiresAt: Date;
        },
    ) {
        super();
    }
}

@CommandHandler(RefreshToken)
export class LoginUserHandler implements ICommandHandler<RefreshToken> {
    constructor(
        // private usersExternalQueryRepository: UsersExternalQueryRepository,
        // private postsQueryRepository: PostsQueryRepository,
        @InjectModel(Session.name) private SessionModel: SessionModelType,
        private sessionsCommandRepository: SessionsCommandRepository,
        private jwtTokenProvider: JwtTokenProvider,
    ) {}

    async execute(command: RefreshToken): Promise<TokensPair> {
        // извлекаем мета данные для сессии
        const { userId, deviceUUID, sessionId, issuedAt, expiresAt } =
            command.payload;

        if (
            !userId ||
            !deviceUUID ||
            !sessionId ||
            !(issuedAt instanceof Date) ||
            isNaN(issuedAt.getTime()) ||
            !(expiresAt instanceof Date) ||
            isNaN(expiresAt.getTime())
        ) {
            throw new UnauthorizedException('Improper refresh token structure');
        }

        // находим сессию
        const sessionDocument =
            await this.sessionsCommandRepository.findSessionBySessionId(
                sessionId,
            );

        if (!sessionDocument) {
            throw new UnauthorizedException('Session not found');
        }

        // создаем пару токенов
        const tokensPair = await this.jwtTokenProvider.generatePairOfTokens({
            userId: userId,
            deviceUUID: deviceUUID,
        });

        // внутри генератора токенов было рассчиатно и возвращено обновленные время создания и время жизни токена, которые мы запишем в сессию
        sessionDocument.updateSession({
            issuedAt: tokensPair.issuedAt,
            expiresAt: tokensPair.expiresAt,
        });

        // сохраняем
        await this.sessionsCommandRepository.save(sessionDocument);

        return {
            accessToken: tokensPair.accessToken,
            refreshToken: tokensPair.refreshToken,
        };
    }
}
