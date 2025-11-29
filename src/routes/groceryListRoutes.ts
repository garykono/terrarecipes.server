import express from 'express';
import { parseInput } from '../middleware/parseInput';
import { normalizeRequest } from '../normalizers/normalizeRequest';

import { GROCERY_LIST_PROFILES } from '../policy/groceryLists.policy';
import { getCategory } from '../controllers/categoryController';
import { previewGroceryList } from '../controllers/groceryListController';

const router = express.Router();

router.route('/preview')
    .post(
        parseInput({ profile: GROCERY_LIST_PROFILES["preview"], normalizer: normalizeRequest }),
        previewGroceryList
    )

export default router;