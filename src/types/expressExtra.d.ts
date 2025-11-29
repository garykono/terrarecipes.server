import "express-serve-static-core";
import type { Logger } from "pino";

declare module "express-serve-static-core" {
    interface Request {
        parsed: { [key: string]: any };
        options: { [key: string]: any };
        log: Logger;
        user: User;
        dataType: dataType;
        id: string;
    }
}