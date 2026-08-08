import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Session, SessionModelType } from '../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { SessionsCommandRepository } from '../../infrastructure/session/sessions.command-repository';
import { JwtTokenProvider } from '../jwt-token-provider/jwt-token-provider.service';
import { Response, Request } from 'express';

export type TokensPair = {
    accessToken: string;
    refreshToken: string;
};

// логиним юзера: а именно - создаем пару токенов и создаем сессию для этого юзера, возвращаем токены
export class LoginUser extends Command<TokensPair> {
    constructor(
        public readonly userId: string,
        public readonly req: Request,
    ) {
        super();
    }
}

@CommandHandler(LoginUser)
export class LoginUserHandler implements ICommandHandler<LoginUser> {
    constructor(
        // private usersExternalQueryRepository: UsersExternalQueryRepository,
        // private postsQueryRepository: PostsQueryRepository,
        @InjectModel(Session.name) private SessionModel: SessionModelType,
        private sessionsCommandRepository: SessionsCommandRepository,
        private jwtTokenProvider: JwtTokenProvider,
    ) {}

    async execute({ userId, req }: LoginUser): Promise<TokensPair> {
        // создаем мета данные для сессии

        const deviceName = req.get('User-Agent') || ''; // или req.headers['user-agent'] - обязательно с малыми, т.к. по стандарту http все приводится к строчным. Методы .get и .header же осуществляют приведение к строчным(маленьким) под капотом
        const deviceIp = req.ip || '';
        //
        // // создаем объект сессии
        // const tempSession = new UserSession(
        //     sessionObjectId,
        //     user.id,
        //     deviceName,
        //     deviceIp,
        // );
        // const sessionIat = tempSession.issuedAt;
        // const sessionExp = tempSession.expiresAt;
        // const sessionDeviceId = tempSession.deviceId;

        // создаем сессию
        const session = this.SessionModel.createInstance({
            userId: userId,
            deviceName: deviceName,
            deviceIp: deviceIp,
        });

        // if (!(await this.postsQueryRepository.ifPostExists(postId))) {
        //     throw new DomainException({
        //         code: DomainExceptionCode.PostNotFound,
        //         message: 'Post not found',
        //     });
        // }

        // const comment = this.CommentModel.createInstance({
        //     relatedPostId: postId,
        //     content: body.content,
        //     commentatorInfo: { userId: user.id, userLogin: user.login },
        // });

        await this.sessionsCommandRepository.save(session);

        // создаем пару токенов
        const tokensPair = await this.jwtTokenProvider.generatePairOfTokens({
            userId: session.userId,
            deviceUUID: session.deviceUUID,
        });

        return tokensPair;
    }
}
