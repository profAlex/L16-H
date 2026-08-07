import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post, Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from '../guards/local/local.auth-guard';
import { ExtractUserIfExistsFromRequest } from '../decorators/extract-user-if-exists.decorator';
import { UserAccessTokenContextDto } from '../guards/dto/user-access-token-context.dto';
import { AuthService } from '../application/auth.service';
import { RegisterNewUserDto } from './input-dto/register-new-user.input-dto';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-pasword.input-dto';
import { RegistrationEmailResendingInputDto } from './input-dto/registration-email-resending.input-dto';
import { JwtAuthGuard } from '../guards/bearer/jwt.auth-guard';
import { MeViewDto } from './view-dto/me.view-dto';
import { UserLoginInputDto } from '../../user-accounts/api/input-dto/login-user.input-dto';
import { Response, Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoginUser } from '../application/usecases/login-user.usecase';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService,
                private readonly commandBus: CommandBus,
                private readonly queryBus: QueryBus,) {
        console.log('AuthController created');
    }

    // Try login user to the system
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @UseGuards(ThrottlerGuard)
    @Post('login')
    async login(
        @Body() body: UserLoginInputDto,
        @ExtractUserIfExistsFromRequest() user: UserAccessTokenContextDto,
        @Res({ passthrough: true }) res: Response,
        @Req() req: Request,
    ): Promise<{
        accessToken: string;
    }> {
        const tokensPair = AWAIT?? this.commandBus.execute<LoginUser>(
            new LoginUser(postId, body, user.id),
        );

        res.cookie('refreshToken', tokensPair.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return this.authService.loginUser(user.id);


        //
        // // здесь логика у нас следующая
        // // - в любом случае создаем новую сессию со всеми присущими определенными идентификаторами и параметрами
        //
        // // создаем сессию в базе
        // const isSuccessfulSessionCreated =
        //     await dataCommandRepository.createSession(tempSession);
    }

    // Password recovery via Email confirmation. Email should be sent with RecoveryCode inside
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(ThrottlerGuard)
    @Post('password-recovery')
    async passwordRecovery(
        @Body() body: PasswordRecoveryInputDto,
    ): Promise<void> {
        return this.authService.passwordRecoveryByEmail(body.email);
    }

    // Confirm Password recovery
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(ThrottlerGuard)
    @Post('new-password')
    async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
        return this.authService.applyNewPassword(
            body.newPassword,
            body.recoveryCode,
        );
    }

    // Confirm registration
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(ThrottlerGuard)
    @Post('registration-confirmation')
    async registrationConfirmation(
        @Body() body: RegistrationConfirmationInputDto,
    ): Promise<void> {
        return this.authService.confirmRegistration(body.code);
    }

    // Registration in the system. Email with confirmation code will be send to passed email address
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(ThrottlerGuard)
    @Post('registration')
    async registration(@Body() body: RegisterNewUserDto): Promise<void> {
        return this.authService.registerAttempt(
            body.login,
            body.password,
            body.email,
        );
    }

    // Resend confirmation registration Email if user exists
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(ThrottlerGuard)
    @Post('registration-email-resending')
    async registrationEmailResending(
        @Body() body: RegistrationEmailResendingInputDto,
    ) {
        return this.authService.resendRegistrationEmail(body.email);
    }

    // Get information about current user
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async requestMe(
        @ExtractUserIfExistsFromRequest() user: UserAccessTokenContextDto,
    ): Promise<MeViewDto> {
        return this.authService.getMeInfo(user.id);
    }
}
