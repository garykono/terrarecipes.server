import { Request, Response, NextFunction } from "express";
import { ProfileMaps } from "../types/policy";

import { buildSearch, BuildSearchOptions } from "../utils/searchUtils/builders/buildSearch";

export const compileSearch = (
    profileMaps: ProfileMaps
) => (req: Request, res: Response, next: NextFunction) => {
    req.options = {
        ...buildSearch({
            profileMaps,
            ...req.parsed
        } as BuildSearchOptions)
    }

    next();
}
