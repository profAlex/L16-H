import {Module} from "@nestjs/common";
import {AuthController} from "./api/auth.controller";
import {JwtModule} from "@nestjs/jwt";
import {envConfig} from "../../config";
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

@Module({
    imports: [
        JwtModule.register({
        secret: envConfig.accessTokenSecret,
        signOptions: {expiresIn: '60m'}
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
    ],
    exports: [],
})

export class AuthorisationModule {
}