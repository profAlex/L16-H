import {Module} from "@nestjs/common";
import {AuthController} from "./api/auth.controller";
import {JwtModule} from "@nestjs/jwt";
import {envConfig} from "../../config_old";
import {NotificationsModule} from "../notifications/notifications.module";
import {UserAccountsModule} from "../user-accounts/user-accounts.module";
import {CryptoService} from "../../core/bcrypt/bcrypt.service";
import {AuthService} from "./application/auth.service";
import {LocalStrategy} from "./guards/local/local.strategy";
import {SecurityDevicesController} from "./api/security-devices.controller";
import {JwtStrategy} from "./guards/bearer/jwt.strategy";
import {UsersService} from "../user-accounts/application/users.service";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "../user-accounts/domain/user.entity";
import {UsersRepository} from "../user-accounts/infrastructure/users.repository";
import {UsersQueryRepository} from "../user-accounts/infrastructure/query/users.query-repository";
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../core/app.config';

@Module({
    imports: [
    //     JwtModule.register({
    //     secret: process.env.ACCESS_TOKEN_SECRET,
    //     signOptions: {expiresIn: '60m'}
    // }),
        JwtModule.registerAsync({
            // Если AppConfig не импортирован глобально как модуль,
            // его нужно раскомментировать здесь в imports:
            // imports: [AppConfig], // но это только для модулей, классы передаются в раздел providers
            inject: [AppConfig],
            useFactory: async (appConfig: AppConfig) => ({
                secret: appConfig.ACCESS_TOKEN_SECRET,
                signOptions: { expiresIn: `${appConfig.ACCESS_TOKEN_LIFETIME}s` },
            }),
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        NotificationsModule,
        UserAccountsModule,
    ],
    controllers: [AuthController, SecurityDevicesController],
    providers: [AuthService,
        // SecurityDevicesQueryRepository,
        LocalStrategy, // Паспортная стратегия для логина
        JwtStrategy,   // Паспортная стратегия для гвардов
        // BasicStrategy,
        CryptoService,
        UsersService,
        UsersRepository,
        UsersQueryRepository,
        // AppConfig, // зарегистрировали этот класс в отдельном глобальном модуле CoreConfig
    ],
    exports: [],
})

export class AuthorisationModule {
}