const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { parseInput } = require('../middleware/parseInput');
const { USERS_PROFILES } = require('../policy/users.policy');
const { normalizeRequest } = require('../normalizers/normalizeRequest');

const router = express.Router();

//router.param('id', userController.checkID);

// Add whitelisting
router.post('/signup', 
    parseInput({ profile: USERS_PROFILES["create"], normalizer: normalizeRequest }),
    authController.signup
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
        parseInput({ profile: USERS_PROFILES["getAll"], normalizer: normalizeRequest }),
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