import { Request, Response, NextFunction } from "express";
import { BaseProfile } from "../types/policy";
import logger from "../utils/logger";

interface ParseInputArgs {
    payload?: any;
    profile: BaseProfile;
    normalizer: (...args: any[]) => any;
}

export const parseInput = ({
    payload,
    profile, 
    normalizer
}: ParseInputArgs) => (req: Request, res: Response, next: NextFunction) => {
    try {
        let freshPayload = payload;
        if (!payload) {
            freshPayload = req.method === 'GET' ? (req.query || {}) : (req.body || {})
        }

        const { clean, rejected } = normalizer(freshPayload, profile);
        req.parsed = {
            profile,
            ...clean
        };
        next();
    } catch (err) {
        next(err);
    }
};