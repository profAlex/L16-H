import { Injectable } from '@nestjs/common';
import { Session, SessionModelType } from '../../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { SessionParameters } from '../sessions.command-repository';

@Injectable()
export class SessionsQueryRepository {
    constructor(
        @InjectModel(Session.name) private SessionModel: SessionModelType,
    ) {}

    async checkIfSessionExists({
        userId,
        deviceUUID,
        expiresAt,
        issuedAt,
    }: SessionParameters): Promise<string | null> {
        const session = await this.SessionModel.findOne(
            {
                userId: userId,
                deviceUUID: deviceUUID,
                expiresAt: expiresAt,
                issuedAt: issuedAt,
                deletedAt: null,
            },
            { projection: { _id: 1 } },
        ).lean();

        return session ? session._id.toString() : null;
    }
}
