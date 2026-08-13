import { Session } from '../../../authorisation/domain/session.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { FlattenMaps } from 'mongoose';


export type ToLean<T> = {
    [K in keyof FlattenMaps<T>]: FlattenMaps<T>[K] extends Date
        ? Date | string
        : FlattenMaps<T>[K];
};

export class DeviceViewDto {
    ip: string;
    title: string; //user-agent

    lastActiveDate: string; //token's issueddAt field
    deviceId: string;

    constructor(session: FlattenMaps<Session>) {
        this.ip = session.deviceIp;
        this.title = session.deviceName;

        // кастим к Date (работает и для Date, и для ISO-строк), т.к. после .lean(), поле issuedAt из базы Mongoose/MongoDB может прийти как string, а не как объект Date
        const issuedAtDate = new Date(session.issuedAt);
        if (isNaN(issuedAtDate.getTime())) {
            throw new InternalServerErrorException(
                `Corrupted session date for device ${session.deviceUUID}`,
            );
        }

        // this.lastActiveDate = issuedAtDate.toISOString();
        this.lastActiveDate = session.issuedAt.toISOString();
        this.deviceId = session.deviceUUID;
    }

    static mapToView(session: FlattenMaps<Session>): DeviceViewDto {
        return new DeviceViewDto(session);
    }
}
