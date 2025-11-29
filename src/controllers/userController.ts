import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import { AppError, ERROR_NAME } from '../utils/appError';
import { deleteOne, getAll, getOne, updateOne } from './handlerFactory';

export const getMe = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    req.params.id = req.user.id;
    next();
  });

export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError(403, ERROR_NAME.FORBIDDEN, 'This route is not for password updates. Please use /updateMyPassword.'));
    } else if (req.body.email) {
        return next(new AppError(403, ERROR_NAME.FORBIDDEN, 'This route is not for email address updates. Please use /updateMyEmail.'));
    }

    req.params.id = req.user.id;
    
    next();
});

/**
 * Sets an account to inactive (so users cannot sign up with the same email address in the future). This is common in many popular
 * apps like Netflix, etc. because you can still use their info for business insights. Should implement account reactivation for
 * this kind of implementation.
 */
export const deleteMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Set account to inactive
    await UserModel.findByIdAndUpdate(req.user.id, { 
        active: false,
        deletedAt: Date.now()
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
})

export const getAllUsers = getAll(UserModel);
export const getUser = getOne(UserModel, [
    { 
        path: 'recipes', 
        select: '-__v -description -ingredients -directions'
    },
    {
        path: 'collections', 
        select: '-__v'
    }
]);
export const updateUser = updateOne(UserModel);
export const deleteUser = deleteOne(UserModel);