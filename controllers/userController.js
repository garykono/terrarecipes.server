const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const { AppError, ERROR_NAME } = require('../utils/appError')
const filterObj = require('../utils/filterObject')
const factory = require('./handlerFactory');

exports.getMe = catchAsync(async(req, res, next) => {
    req.params.id = req.user.id;
    next();
  });

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError(403, ERROR_NAME.FORBIDDEN, 'This route is not for password updates. Please use /updateMyPassword'));
    }

    // 2) Filtered out unwanted field names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'username', 'email');

    // 3) Update the user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, 
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        user: updatedUser
    });
});

/**
 * Sets an account to inactive (so users cannot sign up with the same email address in the future). This is common in many popular
 * apps like Netflix, etc. because you can still use their info for business insights. Should implement account reactivation for
 * this kind of implementation.
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
    // Set account to inactive
    await User.findByIdAndUpdate(req.user.id, { 
        active: false,
        deletedAt: Date.now()
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
})

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User, [
    { 
        path: 'recipes', 
        select: '-__v -description -ingredients -directions'
    },
    {
        path: 'collections', 
        select: '-__v -recipes'
    }
]);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);