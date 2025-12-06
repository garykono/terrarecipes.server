import express from 'express';
import { parseInput } from '../middleware/parseInput';
import { normalizeRequest } from '../normalizers/normalizeRequest';

import { FEEDBACK_PROFILES } from '../policy/feeedback.policy';
import { createFeedback, deleteAllFeedback } from '../controllers/feedbackController';
import { protect, restrictTo } from '../controllers/authController';

const router = express.Router();

router.route('/')
    .post(
        parseInput({ profile: FEEDBACK_PROFILES["create"], normalizer: normalizeRequest }),
        createFeedback
    )
    .delete(
        protect,
        restrictTo('admin'),
        deleteAllFeedback
    )

export default router;