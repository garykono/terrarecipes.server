import express from 'express';
import { getCategory, getHomeRecipes } from '../controllers/categoryController';

const router = express.Router();

router.route('/')
    .get(
        getCategory
    );

router.route('/home')
    .get(
        getHomeRecipes
    );
    
export default router;