import express from 'express';
import { getCategory } from '../controllers/categoryController';

const router = express.Router();

router.route('/')
    .get(
        getCategory
    );
    
export default router;