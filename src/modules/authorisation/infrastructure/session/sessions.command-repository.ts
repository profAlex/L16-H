import { Session, SessionDocument, SessionModelType } from '../../domain/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionsCommandRepository {
    constructor(
        @InjectModel(Session.name) private SessionModel: SessionModelType,
    ) {}

    async save(session: SessionDocument): Promise<void> {
        await session.save();
    }

    async getSessionById(id: string): Promise<SessionDocument | null> {
        return this.SessionModel.findOne({
            _id: id,
            deletedAt: null,
        }).exec();

        // Без .exec() Mongoose возвращает так называемый Query (объект-обещание), который ведет себя как Promise,
        // но им не является. Вызов .exec() превращает его в полноценный нативный JavaScript Promise.
        // Это дает более чистые и понятные стек-трейсы ошибок (stack traces), если база данных начнет сбоить,
        // и исключает странные баги с типизацией в некоторых версиях TypeScript.
    }


}
