

// ниже - расширение Request - но тк у нас гвард возвращает по умолчанию результаты в user поле то надо расширять именно User
import { ObjectId } from 'mongodb';
export {};
declare global {
    namespace Express {
        // Внимание: расширяем именно User!
        export interface User {
            userId: string,
            deviceUUID: string,
            expiresAt: Date,
            issuedAt: Date,
            sessionId: string,
        }
    }
}

// ниже - старая версия из предыдущих уроков
//
// declare global {
//     declare namespace Express {
//         export interface Request {
//             userId: string | undefined;
//             sessionId: string | undefined;
//             deviceId: string | undefined;
//         }
//     }
// }

// ниже - расширение Request
// export {};
// // Declaration Merging
// declare global {
//     namespace Express {
//         export interface Request {
//             userId?: string;
//             sessionId?: string;
//             deviceId?: string;
//         }
//     }
// }
