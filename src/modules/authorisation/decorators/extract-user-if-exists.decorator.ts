import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../guards/dto/user-context.dto';

export const ExtractUserIfExistsFromRequest = createParamDecorator(
    (data: unknown, context: ExecutionContext): UserContextDto | null => {
        const request = context.switchToHttp().getRequest();

        if (!request.user) {
            return null;
        }

        return request.user;
    },
);

export const ExtractLoginIfUserExists = createParamDecorator(
    (data: unknown, context: ExecutionContext): UserContextDto | null => {
        const request = context.switchToHttp().getRequest();

        if (!request.user) {
            return null;
        }

        return request.user;
    },
);
