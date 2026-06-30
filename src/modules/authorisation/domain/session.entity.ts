import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateSessionDomainPayload } from './payload/create-session.domain.payload';
import { UpdateSessionDomainDto } from './dto/update-session.domain.dto';
import { UUIDGeneratorUtil } from '../../../core/uuid-generation/uuid.service';

export const refreshTokenLifeSpanMinutes = 10;

@Schema()
export class Session {
    @Prop({ type: String, required: true })
    userId!: string;

    @Prop({ type: String, required: true })
    deviceUUID!: string;

    @Prop({ type: String, required: true })
    deviceName!: string;

    @Prop({ type: String, required: true })
    deviceIP!: string;

    @Prop({ type: Date, required: true })
    issuedAt!: Date;

    @Prop({ type: Date, required: true })
    expiresAt!: Date;

    @Prop({ type: Date, required: true })
    createdAt!: Date;

    @Prop({ type: Date, required: true })
    deletedAt!: Date | null;

    get id() {
        // @ts-ignore
        return this._id.toString();
    }

    static createInstance(
        sessionPayload: CreateSessionDomainPayload,
    ): SessionDocument {
        const session = new this();

        session.userId = sessionPayload.userId;
        session.deviceUUID = UUIDGeneratorUtil.generateUUID();
        session.deviceName = sessionPayload.deviceName;
        session.deviceIP = sessionPayload.deviceIP;

        session.issuedAt = new Date();
        session.expiresAt = new Date(
            session.issuedAt.getTime() +
                refreshTokenLifeSpanMinutes * 60 * 1000,
        );
        session.createdAt = new Date();
        session.deletedAt = null;

        return session as SessionDocument;
    }

    makeDeleted() {
        if (this.deletedAt != null) {
            return;
        }
        this.deletedAt = new Date();
    }

    updateSession(sessionPayload: UpdateSessionDomainDto) {
        if (
            sessionPayload.issuedAt != null &&
            sessionPayload.issuedAt.getTime() > this.issuedAt.getTime()
        ) {
            this.issuedAt = sessionPayload.issuedAt;
        }
        if (
            sessionPayload.expiresAt != null &&
            sessionPayload.expiresAt.getTime() > this.expiresAt.getTime()
        ) {
            this.expiresAt = sessionPayload.expiresAt;
        }
    }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.loadClass(Session);

export type SessionDocument = HydratedDocument<Session>;

export type SessionModelType = Model<SessionDocument> & typeof Session;
