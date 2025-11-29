import express from 'express';
import { getFiles } from '../controllers/staticController';

const router = express.Router();

router.get('/',
    getFiles)

export default router;