

export {};
// Declaration Merging
declare global {
    namespace Express {
        export interface Request {
            userId?: string;
            sessionId?: string;
            deviceId?: string;
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
