import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Res,
    UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from '../guards/local/local.auth-guard';
import { ExtractUserIfExistsFromRequest } from '../decorators/extract-user-if-exists.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { AuthService } from '../application/auth.service';
import { RegisterNewUserDto } from './input-dto/register-new-user.input-dto';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-pasword.input-dto';
import { RegistrationEmailResendingInputDto } from './input-dto/registration-email-resending.input-dto';
import { JwtAuthGuard } from '../guards/bearer/jwt.auth-guard';
import { MeViewDto } from './view-dto/me.view-dto';
import { UserLoginInputDto } from '../../user-accounts/api/input-dto/login-user.input-dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {
        console.log('AuthController created');
    }

    // Try login user to the system
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(
        @Body() body: UserLoginInputDto,
        @ExtractUserIfExistsFromRequest() user: UserContextDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{
        accessToken: string;
    }> {
        const refreshToken = 'fakeHeader.fakePayload.fakeSignature';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return this.authService.loginUser(user.id);
    }

    // Password recovery via Email confirmation. Email should be sent with RecoveryCode inside
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('password-recovery')
    async passwordRecovery(
        @Body() body: PasswordRecoveryInputDto,
    ): Promise<void> {
        return this.authService.passwordRecoveryByEmail(body.email);
    }

    // Confirm Password recovery
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('new-password')
    async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
        return this.authService.applyNewPassword(
            body.newPassword,
            body.recoveryCode,
        );
    }

    // Confirm registration
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('registration-confirmation')
    async registrationConfirmation(
        @Body() body: RegistrationConfirmationInputDto,
    ): Promise<void> {
        return this.authService.confirmRegistration(body.code);
    }

    // Registration in the system. Email with confirmation code will be send to passed email address
    @HttpCode(HttpStatus.NO_CONTENT)
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
        @ExtractUserIfExistsFromRequest() user: UserContextDto,
    ): Promise<MeViewDto> {
        return this.authService.getMeInfo(user.id);
    }
}
