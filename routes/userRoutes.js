const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { parseInput } = require('../middleware/parseInput');
const { USERS_PROFILES, USER_PROFILE_MAPS } = require('../policy/users.policy');
const { normalizeRequest } = require('../normalizers/normalizeRequest');
const { normalizeSearchRequest } = require('../normalizers/normalizeSearchRequest');
const { compileSearch } = require('../middleware/compileSearch');

const router = express.Router();

//router.param('id', userController.checkID);

router.post('/signup', 
    parseInput({ profile: USERS_PROFILES["create"], normalizer: normalizeRequest }),
    authController.signup
)

router.post('/verification/resend',
    parseInput({ profile: USERS_PROFILES["resendVerification"], normalizer: normalizeRequest }),
    authController.resendVerificationEmail
)

router.post('/verifyEmail/:token',
    authController.verifyEmail
)

router.post('/login', 
    parseInput({ profile: USERS_PROFILES["logIn"], normalizer: normalizeRequest }),
    authController.login
)
router.get('/logout', authController.logout)

router.post('/forgotPassword',
    parseInput({ profile: USERS_PROFILES["forgotPassword"], normalizer: normalizeRequest }),
    authController.forgotPassword
)
router.patch('/resetPassword/:token', 
    parseInput({ profile: USERS_PROFILES["resetPassword"], normalizer: normalizeRequest }),
    authController.resetPassword
)

// Protect all routes after this middleware
// router.use(authController.protect);

router.get('/me', 
    authController.protect,
    userController.getMe, 
    userController.getUser);

router.patch('/updateMyPassword', 
    authController.protect,
    parseInput({ profile: USERS_PROFILES["updatePassword"], normalizer: normalizeRequest }),
    authController.updatePassword
);

router.post('/updateMyEmail', 
    authController.protect,
    parseInput({ profile: USERS_PROFILES["updateEmail"], normalizer: normalizeRequest }),
    authController.updateEmail
);

router.patch('/updateMe', 
    authController.protect,
    // Send custom error if attempting to change password here
    userController.updateMe,
    parseInput({ profile: USERS_PROFILES["updateMe"], normalizer: normalizeRequest }),
    userController.updateUser
);

router.delete('/deleteMe', 
    authController.protect,
    userController.deleteMe
);

//router.use(authController.restrictTo('admin'));

router.route('/')
    .get(
        parseInput({ profile: USERS_PROFILES["getAll"], normalizer: normalizeSearchRequest }),
        compileSearch(USER_PROFILE_MAPS),
        userController.getAllUsers
    )

router.route('/:id')
    .get(userController.getUser)
    .patch(
        parseInput({ profile: USERS_PROFILES["update"], normalizer: normalizeRequest }),
        userController.updateUser
    )
    .delete(userController.deleteUser)

module.exports = router;