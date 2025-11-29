import { Request, Response, NextFunction } from "express";
import { ProfileMaps } from "../types/policy";

const { buildSearch } = require("../utils/searchUtils/builders/buildSearch");

export const compileSearch = (
    profileMaps: ProfileMaps
) => (req: Request, res: Response, next: NextFunction) => {
    req.options = {
        ...buildSearch({
            profileMaps,
            ...req.parsed
        })
    }

    next();
}
