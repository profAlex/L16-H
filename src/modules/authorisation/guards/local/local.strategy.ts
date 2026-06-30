import {Strategy} from "passport-local";
import {PassportStrategy} from "@nestjs/passport";
import {Injectable, UnauthorizedException} from "@nestjs/common";
import {AuthService} from "../../application/auth.service";
import {UserContextDto} from "../dto/user-context.dto";
import {DomainException} from "../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../core/exceptions/domain-exception-codes";


@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private authService: AuthService) {
        super({usernameField: 'loginOrEmail'});
    };

    //validate возвращает то, что впоследствии будет записано в req.user
    async validate(loginOrEmail: string, password: string): Promise<UserContextDto> {
        const userData = await this.authService.validateUserCreds(loginOrEmail, password);
        // этот конкретный гвард написан только для классического HTTP-контроллера, пожтому мучиться с кастомными обработчиками ошибок нет смысла
        // console.log("TEST_STOP");
        if (!userData) {
            // throw new UnauthorizedException({ message: 'Wrong login or password' });
            throw new DomainException({
                code: DomainExceptionCode.Unauthorized,
                message: 'Wrong login or password!',
            });
        }

        return userData;
    }
}