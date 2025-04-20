const jwt = require('jsonwebtoken');
const crypto = require('crypto')
const { promisify } = require('util');

const catchAsync = require('../utils/catchAsync');
const { AppError, ERROR_NAME } = require('../utils/appError')
const sendEmail = require('../utils/email')
const User = require('../models/userModel');
const Recipe = require('../models/recipeModel')
const Collection = require('../models/collectionModel')

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // Cannot be opened by the browser
        httpOnly: true,
        sameSite: 'none',
        secure: true
    };

    // secure === true means cookie will only be sent over encrypted connection (https). So when we use http, the cookie won't be 
    // sent. Therefore, we only run it in production
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.domain = "terrarecipes.xyz";
    }
    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async(req, res, next) => {
    const newUser = await User.create({
        username: req.body.username,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        email: req.body.email,
        //passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    })

    createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exists
    if (!email || !password) {
        return next(new AppError(400, ERROR_NAME.VALIDATION_ERROR, 'Please provide email and password!'));
    }

    // 2) Check if user exists && pasword is correct
    // const user = User.findOne({ email: email })
    // we are including the + operator because we have select: false for getting passwords on query, so we are forcing to include it
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'Incorrect email or password'));
    }

    // 3) If everything is ok, send the JWT to client
    createAndSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 5000),
        httpOnly: true,
        sameSite: 'none',
        secure: true,
    });
    res.status(200).json({ 
        status: 'success' 
    });
  };

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token = '';
    let foundJWT = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.cookie) {
        const parsedCookies = req.headers.cookie.split(';');
        parsedCookies.forEach((value, index) => {
            if (value.startsWith('jwt=')) {
                token = parsedCookies[index].slice('jwt='.length);
                if (foundJWT === true) {
                    return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'More than one set of login credentials (JWT) provided.'));
                } else {
                    foundJWT = true;
                }
            }
        }) 
    }

    if (!token) {
        console.log('no token was given')
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'You are not logged in! Please log in to get access.'));
    }
    // 2) Verification token
    // Syntax might be confusing by "promisify" turns the passed in function into a promise, and the arguments (token, ...) are arguments
    // for that promise
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    console.log('user id', decoded.id)
    if (!freshUser) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'The user belonging to the token no longer exists.'))
    }

    // 4) Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'User recently changed password. Please log in again.'));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    next();
});

exports.assignAuthor = (req, res, next) => {
    req.body.author = req.user.id;

    next();
};

exports.setDataType = (dataType) => {
    return (req, res, next) => {
        req.dataType = dataType;
    
        next();
    }
}

exports.verifyAuthor = catchAsync (async (req, res, next) => {
    // 1) Retrieve the data based on the id given
    const itemId = req.params.id;
    let item = null;
    if (req.dataType === 'recipe') {
        item = await Recipe.findById(itemId);
    } else if (req.dataType === 'collection') {
        item = await Collection.findById(itemId);
    }
    if (!item) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, `There is no ${req.dataType} with that id.`));
    }

    // 2) Check if the resource belongs to the user
    const userId = req.user.id;
    if (item.author.toHexString() !== userId) {
        return next(new AppError(403, ERROR_NAME.FORBIDDEN, 'This resource does not belong to the logged in user.'));
    }

    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array like ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError(403, ERROR_NAME.FORBIDDEN, 'You do not have permission to perform this action'));
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'There is no user with that email address.'));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\n
    If you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 mins)',
            message
        });
    } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError(500, ERROR_NAME.SERVER_ERROR, 'There was an error sending the email. Try again later!'));
    }
    

    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({ 
        passwordResetToken: hashedToken, 
        passwordResetExpires: {$gt: Date.now()} 
    });

    // 2) If the token has not expired, and there is user, set the new password
    if (!user) {
        return (next(new AppError(400, ERROR_NAME.INVALID_JWT, 'Token is invalid or has expired.')))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user (this is done automatically as a middleware function in userModel)

    // 4) Log the user in, send JWT
    createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from the collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'Password is incorrect'));
    } 

    // 3) If so, update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate() will not work because it won't get validated AND it won't pass through our middleware

    // 4) Log user in, send JWT
    createAndSendToken(user, 200, res);
});
