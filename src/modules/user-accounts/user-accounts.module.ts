import {Module} from '@nestjs/common';
import {UsersController} from './api/users.controller';
import {UsersService} from './application/users.service';
import {MongooseModule} from '@nestjs/mongoose';
import {User, UserSchema} from './domain/user.entity';
import {UsersRepository} from './infrastructure/users.repository';
import {UsersQueryRepository} from './infrastructure/query/users.query-repository';
import {SecurityDevicesQueryRepository} from './infrastructure/query/security-devices.query-repository';
import {SecurityDevicesController} from './api/security-devices.controller';
import {UsersExternalQueryRepository} from './infrastructure/external-query/users.external-query-repository';
import {UsersExternalService} from './application/users.external-service';
import {CryptoService} from "../../core/bcrypt/bcrypt.service";

@Module({
    imports: [
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
    ],
    controllers: [UsersController, SecurityDevicesController],
    providers: [
        UsersService,
        UsersRepository,
        UsersQueryRepository,
        SecurityDevicesQueryRepository,
        UsersExternalQueryRepository,
        UsersExternalService,
        CryptoService,
    ],
    exports: [UsersExternalQueryRepository, UsersExternalService],
})
export class UserAccountsModule {
}
