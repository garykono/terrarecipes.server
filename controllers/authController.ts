import { Request, Response, NextFunction, CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { promisify } from 'util';

import env from '../utils/env';
import catchAsync from '../utils/catchAsync';
import { AppError, ERROR_NAME } from '../utils/appError';
import logger from "../utils/logger";
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail, sendPasswordChangedEmail, sendEmailChangedEmail } from '../utils/email/email';
import { User, UserDoc, UserModel } from '../models/userModel';
import { RecipeModel } from '../models/recipeModel';
import { CollectionModel } from '../models/collectionModel';
import { roles } from '../types/auth';
import { dataType } from '../types/general';
import { buildFrontendUrl } from '../utils/url';
import { hashToken } from '../utils/hashedTokens';
import { USER_EMAIL_THROTTLING } from '../policy/users.policy';

import type { JwtPayload } from "jsonwebtoken";

interface AuthPayload extends JwtPayload {
  id: string;
}


const signToken = (id: string) => {
    return jwt.sign({ id }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    });
};

const createAndSendToken = (user: UserDoc, statusCode: number, res: Response) => {
    const token = signToken(user.id);
    const daysToExpire = Number(env.JWT_COOKIE_EXPIRES_IN_DAYS);

    const cookieOptions = {
        expires: new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000),
        // Cannot be opened by the browser
        httpOnly: true,
        // sameSite: 'none',
        // secure: true
    };

    // secure === true means cookie will only be sent over encrypted connection (https). So when we use http, the cookie won't be 
    // sent. Therefore, we only run it in production
    // if (process.env.NODE_ENV === 'production') {
    //     cookieOptions.domain = process.env.CLIENT_URL_PROD;
    // } else {
    //     cookieOptions.domain = process.env.CLIENT_URL_DEV;
    // }
    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    (user as any).password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

const issueAndSendVerifyEmail = async (user: UserDoc) => {
    // Generate the random token
    const { rawToken, minutesUntilExpire } = await user.createSignupEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    
    // Send it to user's email
    const verificationUrl = buildFrontendUrl(`/verifyEmail/${rawToken}`);

    const { data, error } = await sendVerificationEmail({
        email: user.email,
        verificationUrl,
        minutesUntilExpire
    });

    return { data, error };
}

export const signup = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const newUser = await UserModel.create({
        username: req.parsed.username,
        password: req.parsed.password,
        passwordConfirm: req.parsed.passwordConfirm,
        email: req.parsed.email,
        //passwordChangedAt: req.parsed.passwordChangedAt,
        role: "user"
    }) as UserDoc;

    logger.info({ username: req.parsed.username, email: req.parsed.email }, "user created")

    // Send an email, no need to wait for the email to send
    const { data, error } = await issueAndSendVerifyEmail(newUser);

    if (error) req.log.warn({ email: newUser.email, err: error }, "Email Verification email failed to send")
    
    res.status(201).json({
        status: 'success',
        data: {
            newUser
        }
    });
});

export const resendVerificationEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on POSTed email
    const user = await UserModel.findOne({ email: req.parsed.email }).select(
        "+signupEmailLastSentAt +signupEmailSendCount24h"
    ) as UserDoc;
    if(!user) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'There is no user with that email address.'));
    }
    
    // 2) Check if already verified
    if (user.verifiedAt) {
        return next(new AppError(409, ERROR_NAME.ALREADY_VERIFIED, 'This email address has already been verified.'));
    };
    
    // 3) Enforce minimum gap
    const now = Date.now();
    const cfg = USER_EMAIL_THROTTLING.signup;
    
    if (
        user.signupEmailLastSentAt &&
        now - user.signupEmailLastSentAt.getTime() < cfg.minIntervalMs
    ) {
        const secondsLeft = Math.ceil((cfg.minIntervalMs - (now - user.signupEmailLastSentAt.getTime())) / 1000);

        return next(
            new AppError(
                429, 
                ERROR_NAME.RESEND_INTERVAL_NOT_ELAPSED, 
                `You can request another verification email in ${secondsLeft} seconds.`, 
                { secondsLeft }
            )
        );
    };

    // 4) Enforce daily window cap
    if (
        user.signupEmailLastSentAt &&
        now - user.signupEmailLastSentAt.getTime() > cfg.windowMs
    ) {
        // reset daily counter if last email was more than a day ago
        user.signupEmailSendCount24h = 0;
    }

    if (user.signupEmailSendCount24h >= cfg.maxInWindow) {
        return next(
            new AppError(429, ERROR_NAME.DAILY_EMAIL_LIMIT_EXCEEDED, "Too many verification email requests. Please try again later.")
        );
    }

    // 5) Update throttle fields
    user.signupEmailLastSentAt = new Date(now);
    user.signupEmailSendCount24h += 1;
    await user.save({ validateBeforeSave: false });

    // 6) Send email
    const { data, error } = await issueAndSendVerifyEmail(user);
    
    if (error) {
        user.signupEmailTokenHash = undefined;
        user.signupEmailTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError(500, ERROR_NAME.EMAIL_SEND_ERROR, 'There was an error sending the email. Try again later!'));
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = hashToken(req.params.token);
    const now = Date.now();

    // 1) Try to look up user by signup email token
    let user = await UserModel.findOne({ 
        signupEmailTokenHash: hashedToken, 
        signupEmailTokenExpires: {$gt: now} 
    }) as UserDoc;

    if (user) {
        user.signupEmailTokenHash = undefined;
        user.signupEmailTokenExpires = undefined;

        if (!user.verifiedAt) {
            user.verifiedAt = new Date(now);
        } 
        await user.save();

        // 3) Send welcome email
        const { data, error } = await sendWelcomeEmail({
            username: user.username,
            email: user.email,
            homeUrl: buildFrontendUrl(``)
        });

        if (error) req.log.warn({ email: user.email, err: error }, "Welcome email failed to be send")
            
        // 4) Send jwt to sign user in
        createAndSendToken(user, 200, res);
    }

    // 2) Try to look up by pending email token
    user = await UserModel.findOne({ 
        pendingEmailTokenHash: hashedToken, 
        pendingEmailTokenExpires: {$gt: Date.now()} 
    }) as UserDoc;

    if (user) {
        const oldEmail = user.email;
        const accountWasPreviouslyVerified = await user.updateEmailAddressWithPending();

        // 3) Send email changed email to old email address if the account has been verified before
        if (accountWasPreviouslyVerified) {
            const { data, error } = await sendEmailChangedEmail({
                email: oldEmail,
                changePasswordUrl: buildFrontendUrl(`/changePassword`)
            });

            if (error) req.log.warn({ email: oldEmail, err: error }, "Email Changed email failed to send")
        } else {
            // Otherwise, this is the first time they've been verified so send a welcome email
            const { data, error } = await sendWelcomeEmail({
                username: user.username,
                email: user.email,
                homeUrl: buildFrontendUrl(``)
            });

            if (error) req.log.warn({ email: user.email, err: error }, "Welcome email failed to send")
        }
        
        // 4) Send jwt to sign user in
        createAndSendToken(user, 200, res);
    }


    // 3) Token didn't match any existing verification tokens
    if (!user) {
        return (next(new AppError(400, ERROR_NAME.INVALID_TOKEN, 'Token is invalid or has expired.')))
    }
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.parsed;

    // 1) Check if email and password exists
    if (!email || !password) {
        return next(new AppError(400, ERROR_NAME.VALIDATION_ERROR, 'Please provide email and password!'));
    }

    // 2) Check if user exists && pasword is correct
    const user = await UserModel.findOne({ email }).select('+password') as UserDoc;

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'Incorrect email or password'));
    }

    // 3) If everything is ok, send the JWT to client
    createAndSendToken(user, 200, res);
});

export const logout = (req: Request, res: Response) => {
    const cookieOptions: CookieOptions = {
        expires: new Date(Date.now() + 5000),
        httpOnly: true,
        // sameSite: 'none',
        // secure: true,
    };
    
    if (env.NODE_ENV === 'production') {
        cookieOptions.domain = "terrarecipes.xyz";
    }

    res.cookie('jwt', 'loggedout', cookieOptions);

    res.status(200).json({ 
        status: 'success' 
    });
  };

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    let token = '';
    let foundJWT = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.cookie) {
        const parsedCookies = req.headers.cookie.split(';').map(val => val.trim());
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
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'You are not logged in! Please log in to get access.'));
    }
    // 2) Verification token
    // Syntax might be confusing by "promisify" turns the passed in function into a promise, and the arguments (token, ...) are arguments
    // for that promise
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    // 3) Check if user still exists
    const freshUser = await UserModel.findById(decoded.id) as UserDoc;
    if (!freshUser) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'The user belonging to the token no longer exists.'))
    }

    // 4) Check if user changed password after the token was issued
    if (typeof decoded.iat !== "number") {
        logger.warn("Token is missing iat timestamp");
        return next(new AppError(500, ERROR_NAME.SERVER_ERROR, "An error has occurred."));
    }
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'User recently changed password. Please log in again.'));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    next();
});

export const assignAuthor = (req: Request, res: Response, next: NextFunction) => {
    req.parsed.author = req.user.id;

    next();
};

export const setDataType = (dataType: dataType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        req.dataType = dataType;
    
        next();
    }
}

export const verifyAuthor = catchAsync (async (req: Request, res: Response, next: NextFunction) => {
    // 1) Retrieve the data based on the id given
    const itemId = req.params.id;
    let item = null;
    if (req.dataType === 'recipe') {
        item = await RecipeModel.findById(itemId);
    } else if (req.dataType === 'collection') {
        item = await CollectionModel.findById(itemId);
    }
    if (!item) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, `There is no ${req.dataType} with that id.`));
    }

    // 2) Check if the resource belongs to the user
    const userId = req.user.id;
    if (item.author?.toHexString() !== userId) {
        return next(new AppError(403, ERROR_NAME.FORBIDDEN, 'This resource does not belong to the logged in user.'));
    }

    next();
});

export const restrictTo = (...roles: roles) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // roles is an array like ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError(403, ERROR_NAME.FORBIDDEN, 'You do not have permission to perform this action'));
        }
        next();
    }
}

export const forgotPassword = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on POSTed email
    const user = await UserModel.findOne({ email: req.parsed.email }).select(
        "+passwordResetLastSentAt +passwordResetSendCount24h"
    ) as UserDoc;
    if(!user) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'There is no user with that email address.'));
    }

    // 2) Enforce minimum gap
    const now = Date.now();
    const cfg = USER_EMAIL_THROTTLING.passwordReset;
    if (
        user.passwordResetLastSentAt &&
        now - user.passwordResetLastSentAt.getTime() < cfg.minIntervalMs
    ) {
        const secondsLeft = Math.ceil((cfg.minIntervalMs - (now - user.passwordResetLastSentAt.getTime())) / 1000);

        return next(
            new AppError(
                429, 
                ERROR_NAME.RESEND_INTERVAL_NOT_ELAPSED, 
                `You can request another forgot password email in ${secondsLeft} seconds.`, 
                { secondsLeft }
            )
        )
    };

    // 3) Enforce daily window cap
    if (
        user.passwordResetLastSentAt &&
        now - user.passwordResetLastSentAt.getTime() > cfg.windowMs
    ) {
        // reset daily counter if last email was more than a day ago
        user.passwordResetSendCount24h = 0;
    }

    if (user.passwordResetSendCount24h >= cfg.maxInWindow) {
        return next(
            new AppError(429, ERROR_NAME.DAILY_EMAIL_LIMIT_EXCEEDED, "Too many reset password email requests. Please try again later.")
        );
    }

    // 4) Generate the random reset token
    const { rawToken, minutesUntilExpire } = user.createPasswordResetToken();

    // 5) Update throttle fields
    user.passwordResetLastSentAt = new Date(now);
    user.passwordResetSendCount24h += 1;
    await user.save({ validateBeforeSave: false });
    
    // 6) Send it to user's email
    const resetUrl = buildFrontendUrl(`/resetPassword/${rawToken}`);
    const { data, error } = await sendPasswordResetEmail({
        email: user.email,
        resetUrl,
        minutesUntilExpire
    });
    
    if (error) {
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        req.log.warn({ email: user.email, err: error }, "Password Reset email failed to send. Reset token cleared.")

        return next(new AppError(500, ERROR_NAME.EMAIL_SEND_ERROR, 'There was an error sending the email. Try again later!'));
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    });
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on the token
    const hashedToken = hashToken(req.params.token);

    const user = await UserModel.findOne({ 
        passwordResetTokenHash: hashedToken, 
        passwordResetExpires: {$gt: Date.now()} 
    });

    // 2) If the token has not expired, and there is user, set the new password
    if (!user) {
        return (next(new AppError(400, ERROR_NAME.INVALID_TOKEN, 'Token is invalid or has expired.')))
    }
    user.password = req.parsed.password;
    user.passwordConfirm = req.parsed.passwordConfirm;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user (this is done automatically as a middleware function in userModel)

    // 4) Send an email that the password changed
    const { data, error } = await sendPasswordChangedEmail({
        email: user.email,
        changePasswordUrl: buildFrontendUrl(`/forgotPassword`)
    });

    if (error) req.log.warn({ email: user.email, err: error }, "Password Changed email failed to send")

    // 5) Password reset successful
    res.status(200).json({
        status: 'success',
        message: 'Password has been reset!'
    });
});

export const updatePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user
    const user = await UserModel.findById(req.user.id).select('+password') as UserDoc;

    // 2) Check if POSTed password is correct
    if (!user || !(await user.correctPassword(req.parsed.passwordCurrent, user.password))) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'Password is incorrect'));
    } 

    // 3) If so, update the password
    user.password = req.parsed.password;
    user.passwordConfirm = req.parsed.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate() will not work because it won't get validated AND it won't pass through our middleware

    // 4) Send an email that the password changed
    const { data, error } = await sendPasswordChangedEmail({
        email: user.email,
        changePasswordUrl: buildFrontendUrl(`/forgotPassword`)
    });

    if (error) req.log.warn({ email: user.email, err: error }, "Password Changed email failed to send")

    // 5) Log user in, send JWT
    createAndSendToken(user, 200, res);
});

export const updateEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { newEmail, password } = req.parsed;

    // 1) Check if user exists && password is correct
    const user = await UserModel.findById(req.user.id).select('+password +changeEmailEmailLastSentAt +changeEmailEmailSendCount24h') as UserDoc;

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError(401, ERROR_NAME.UNAUTHORIZED, 'Incorrect email or password'));
    }

    // 2) Check if new email address already exists
    const normalizedNew = newEmail.trim().toLowerCase();
    if (normalizedNew === user.email) {
        return next(new AppError(409, ERROR_NAME.SAME_EMAIL, 'That is already your current email.'));
    }

    const existing = await UserModel.findOne({ email: normalizedNew }).lean();
    if (existing) {
        return next(new AppError(409, ERROR_NAME.ALREADY_TAKEN, 'That email is already in use.'));
    }

    // 3) Enforce minimum gap
    const now = Date.now();
    const cfg = USER_EMAIL_THROTTLING.changeEmail;
    if (
        user.changeEmailEmailLastSentAt &&
        now - user.changeEmailEmailLastSentAt.getTime() < cfg.minIntervalMs
    ) {
        const secondsLeft = Math.ceil((cfg.minIntervalMs - (now - user.changeEmailEmailLastSentAt.getTime())) / 1000);

        return next(
            new AppError(
                429, 
                ERROR_NAME.RESEND_INTERVAL_NOT_ELAPSED, 
                `You can request another forgot password email in ${secondsLeft} seconds.`, 
                { secondsLeft }
            )
        )
    };

    // 4) Enforce daily window cap
    if (
        user.changeEmailEmailLastSentAt &&
        now - user.changeEmailEmailLastSentAt.getTime() > cfg.windowMs
    ) {
        // reset daily counter if last email was more than a day ago
        user.changeEmailEmailSendCount24h = 0;
    }

    if (user.changeEmailEmailSendCount24h >= cfg.maxInWindow) {
        return next(
            new AppError(429, ERROR_NAME.DAILY_EMAIL_LIMIT_EXCEEDED, "Too many reset password email requests. Please try again later.")
        );
    }

    // 5) Update throttle fields
    user.changeEmailEmailLastSentAt = new Date(now);
    user.changeEmailEmailSendCount24h += 1;
    await user.save({ validateBeforeSave: false });

    // 6) Generate the random token and set the new email address to pending
    const { rawToken, minutesUntilExpire } = user.createPendingEmailVerificationToken();
    user.pendingEmail = newEmail;
    await user.save({ validateBeforeSave: false });
    
    // 7) Send it to user's email
    const verificationUrl = buildFrontendUrl(`/verifyEmail/${rawToken}`);

    const { data, error } = await sendVerificationEmail({
        email: newEmail,
        verificationUrl,
        minutesUntilExpire
    });

    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
    });
});
