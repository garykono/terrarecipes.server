import express from 'express';
import { parseInput } from '../middleware/parseInput';
import { USERS_PROFILES, USER_PROFILE_MAPS } from '../policy/users.policy';
import { normalizeRequest } from '../normalizers/normalizeRequest';
import { normalizeSearchRequest } from '../normalizers/normalizeSearchRequest';
import { compileSearch } from '../middleware/compileSearch';
import { forgotPassword, login, logout, protect, resendVerificationEmail, resetPassword, signup, updateEmail, updatePassword, verifyEmail } from '../controllers/authController';
import { deleteMe, deleteUser, getAllUsers, getMe, getUser, updateMe, updateUser } from '../controllers/userController';

const router = express.Router();

//router.param('id', checkID);

router.post('/signup', 
    parseInput({ profile: USERS_PROFILES["signUp"], normalizer: normalizeRequest }),
    signup
)

router.post('/verification/resend',
    parseInput({ profile: USERS_PROFILES["resendVerification"], normalizer: normalizeRequest }),
    resendVerificationEmail
)

router.post('/verifyEmail/:token',
    verifyEmail
)

router.post('/login', 
    parseInput({ profile: USERS_PROFILES["logIn"], normalizer: normalizeRequest }),
    login
)
router.get('/logout', logout)

router.post('/forgotPassword',
    parseInput({ profile: USERS_PROFILES["forgotPassword"], normalizer: normalizeRequest }),
    forgotPassword
)
router.patch('/resetPassword/:token', 
    parseInput({ profile: USERS_PROFILES["resetPassword"], normalizer: normalizeRequest }),
    resetPassword
)

// Protect all routes after this middleware
// router.use(protect);

router.get('/me', 
    protect,
    getMe, 
    getUser);

router.patch('/updateMyPassword', 
    protect,
    parseInput({ profile: USERS_PROFILES["updatePassword"], normalizer: normalizeRequest }),
    updatePassword
);

router.post('/updateMyEmail', 
    protect,
    parseInput({ profile: USERS_PROFILES["updateEmail"], normalizer: normalizeRequest }),
    updateEmail
);

router.patch('/updateMe', 
    protect,
    // Send custom error if attempting to change password here
    updateMe,
    parseInput({ profile: USERS_PROFILES["updateMe"], normalizer: normalizeRequest }),
    updateUser
);

router.delete('/deleteMe', 
    protect,
    deleteMe
);

//router.use(restrictTo('admin'));

router.route('/')
    .get(
        parseInput({ profile: USERS_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(USER_PROFILE_MAPS),
        getAllUsers
    )

router.route('/:id')
    .get(getUser)
    .patch(
        parseInput({ profile: USERS_PROFILES["update"], normalizer: normalizeRequest }),
        updateUser
    )
    .delete(deleteUser)

export default router;