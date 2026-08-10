import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { User, UserSchema } from '../user-accounts/domain/user.entity';
import { UsersController } from '../user-accounts/api/users.controller';
import { SecurityDevicesController } from '../authorisation/api/security-devices.controller';
import { Session, SessionSchema } from '../authorisation/domain/session.entity';
import { JwtRefreshTokenStrategy } from '../authorisation/guards/refresh-token/refresh-token.strategy';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    ],
    controllers: [SecurityDevicesController],
    providers: [
        JwtRefreshTokenStrategy
    ],
    exports: [],
})

export class SecurityDevicesModule {
}
