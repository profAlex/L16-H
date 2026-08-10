import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtRefreshAuthGuard } from '../../authorisation/guards/refresh-token/refresh-token.auth-guard';
import { CurrentUserMetaData } from '../../authorisation/decorators/extract-meta-data-from-req.decorator';
import { UserRefreshTokenContextAndMetaDataDto } from '../../authorisation/decorators/dto/user-refresh-token-context-and-meta-data.dto';

@Controller('security')
export class SecurityController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {
        console.log('SecurityController created');
    }

    // // Try login user to the system
    // @HttpCode(HttpStatus.OK)
    // @UseGuards(LocalAuthGuard)
    // @UseGuards(ThrottlerGuard)
    // @Post('login')
    // async login(
    //     //@Body() body: UserLoginInputDto,
    //     @ExtractUserIfExistsFromRequest() user: UserAccessTokenContextDto,
    //     @Res({ passthrough: true }) res: Response,
    //     @Req() req: Request,
    // ): Promise<{
    //     accessToken: string;
    // }> {
    //     const tokensPair: TokensPair = await this.commandBus.execute<LoginUser>(
    //         new LoginUser(user.id, req),
    //     );
    //
    //     res.cookie('refreshToken', tokensPair.refreshToken, {
    //         httpOnly: true,
    //         secure: true,
    //         sameSite: 'none',
    //         maxAge: 7 * 24 * 60 * 60 * 1000,
    //     });
    //
    //     return { accessToken: tokensPair.accessToken };
    // }
    //
    //
    // // Generate new pair of access and refresh tokens (in cookie client must send
    // // correct refreshToken that will be revoked after refreshing)
    // // Device LastActiveDate should be overridden by issued Date of new refresh token
    // @HttpCode(HttpStatus.OK)
    // @UseGuards(JwtRefreshAuthGuard)
    // @Post('refresh-token')
    // async refreshToken(
    //     //@Body() body: UserLoginInputDto,
    //     @CurrentUserMetaData() user: UserRefreshTokenContextAndMetaDataDto,
    //     @Res({ passthrough: true }) res: Response,
    // ): Promise<{
    //     accessToken: string;
    // }> {
    //     const tokensPair: TokensPair = await this.commandBus.execute<RefreshToken>(
    //         new RefreshToken({
    //             userId: user.userId,
    //             deviceUUID: user.deviceUUID,
    //             sessionId: user.sessionId,
    //             issuedAt: user.issuedAt,
    //             expiresAt: user.expiresAt,
    //         }),
    //     );
    //
    //     res.cookie('refreshToken', tokensPair.refreshToken, {
    //         httpOnly: true,
    //         secure: true,
    //         sameSite: 'none',
    //         maxAge: 7 * 24 * 60 * 60 * 1000,
    //     });
    //
    //     return { accessToken: tokensPair.accessToken };
    // }
    //
    //
    // // Password recovery via Email confirmation. Email should be sent with RecoveryCode inside
    // @HttpCode(HttpStatus.NO_CONTENT)
    // @UseGuards(ThrottlerGuard)
    // @Post('password-recovery')
    // async passwordRecovery(
    //     @Body() body: PasswordRecoveryInputDto,
    // ): Promise<void> {
    //     return this.authService.passwordRecoveryByEmail(body.email);
    // }
    //
    // // Confirm Password recovery
    // @HttpCode(HttpStatus.NO_CONTENT)
    // @UseGuards(ThrottlerGuard)
    // @Post('new-password')
    // async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    //     return this.authService.applyNewPassword(
    //         body.newPassword,
    //         body.recoveryCode,
    //     );
    // }
    //
    // // Confirm registration
    // @HttpCode(HttpStatus.NO_CONTENT)
    // @UseGuards(ThrottlerGuard)
    // @Post('registration-confirmation')
    // async registrationConfirmation(
    //     @Body() body: RegistrationConfirmationInputDto,
    // ): Promise<void> {
    //     return this.authService.confirmRegistration(body.code);
    // }
    //
    // // Registration in the system. Email with confirmation code will be send to passed email address
    // @HttpCode(HttpStatus.NO_CONTENT)
    // @UseGuards(ThrottlerGuard)
    // @Post('registration')
    // async registration(@Body() body: RegisterNewUserDto): Promise<void> {
    //     return this.authService.registerAttempt(
    //         body.login,
    //         body.password,
    //         body.email,
    //     );
    // }
    //
    // // Resend confirmation registration Email if user exists
    // @HttpCode(HttpStatus.NO_CONTENT)
    // @UseGuards(ThrottlerGuard)
    // @Post('registration-email-resending')
    // async registrationEmailResending(
    //     @Body() body: RegistrationEmailResendingInputDto,
    // ) {
    //     return this.authService.resendRegistrationEmail(body.email);
    // }
    //
    //
    // @HttpCode(HttpStatus.NO_CONTENT)
    // @UseGuards(JwtRefreshAuthGuard)
    // @Post('logout')
    // async logout(
    //     @CurrentUserMetaData() user: UserRefreshTokenContextAndMetaDataDto,
    //     @Res({ passthrough: true }) res: Response,
    // ): Promise<void> {
    //     await this.commandBus.execute<Logout>(
    //         new Logout(user.sessionId),
    //     );
    //
    //     // очищаем refreshToken в куках браузера
    //     res.clearCookie('refreshToken', {
    //         httpOnly: true,
    //         secure: true,
    //         sameSite: 'none',
    //     });
    // }

    // Returns all devices with active sessions for current user
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtRefreshAuthGuard)
    @Get('devices')
    async getAllActiveSessions(
        @CurrentUserMetaData() user: UserRefreshTokenContextAndMetaDataDto,
    ): Promise<MeViewDto> {
        return this.queryBus.execute<>();
    }

    // Terminate all other (exclude current) device's sessions
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtRefreshAuthGuard)
    @Delete('devices')
    async deleteAllSessionButCurrentOne(
        @CurrentUserMetaData() user: UserRefreshTokenContextAndMetaDataDto,
    ): Promise<void> {
        return this.commandBus.execute<DeletePostById>(new DeletePostById(id));
    }

    // Terminate specified device session
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtRefreshAuthGuard)
    @Delete('devices/:deviceId')
    async deleteSessionByDeviceId(
        @Param('deviceId') deviceId: string,
        @CurrentUserMetaData() user: UserRefreshTokenContextAndMetaDataDto,
    ): Promise<void> {
        return this.commandBus.execute<DeletePostById>(new DeletePostById(id));
    }
}
