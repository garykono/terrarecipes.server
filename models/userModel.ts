import {
    Schema,
    model,
    ValidatorProps,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const validator = require('validator');
const { generateToken } = require('../utils/hashedTokens');

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'A user must have a username.'],
        index: {
            unique: true,
            collation: { locale: 'en', strength: 2 }
        },
        trim: true,
        minLength: 3,
        maxLength: 20
    },
    password: {
        type: String,
        required: [true, 'Please provide a password.'],
        minLength: 8,
        maxLength: 30,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password.'],
        // This only works on CREATE and SAVE. Wouldn't work if we updated the password.
        validate: {
            validator: function (this: any, el: string) {
                return el === this.password;
            },
            message: "Passwords are not the same."
        },
        select: false
    },
    email: {
        type: String,
        required: [true, 'Please provide your email.'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail, 
            message: props => `${props.value} is not a valid email address.`
        }
    },
    verifiedAt: {
        type: Date,
        select: true,
    },
    signupEmailTokenHash: {
        type: String,
        select: false
    },
    signupEmailTokenExpires: {
        type: Date,
        select: false
    },
    pendingEmail: {
        type: String,
        unique: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail, 
            message: (props: ValidatorProps) => `${props.value} is not a valid email address.`
        }
    },
    pendingEmailTokenHash: {
        type: String,
        select: false
    },
    pendingEmailTokenExpires: {
        type: Date,
        select: false
    },
    // Throttling for signup / verify email
    signupEmailLastSentAt: {
        type: Date,
        select: false,
    },
    signupEmailSendCount24h: {
        type: Number,
        default: 0,
        select: false,
    },
    // Throttling for change email
    changeEmailEmailLastSentAt: {
        type: Date,
        select: false,
    },
    changeEmailEmailSendCount24h: {
        type: Number,
        default: 0,
        select: false,
    },
    passwordChangedAt: {
        type: Date,
        select: false
    },
    passwordResetTokenHash: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    // Throttling for password reset
    passwordResetLastSentAt: {
        type: Date,
        select: false,
    },
    passwordResetSendCount24h: {
        type: Number,
        default: 0,
        select: false,
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        // Mongoose automatically translates this to a readable date
        default: Date.now(),
        // Ignores it in all queries (but still shows up in database)
        select: false
    },
    deletedAt: {
        type: Date,
        select: false
    }
},
{
    toJSON: { virtuals : true },
    toObject: { virtuals : true }
});

// Virtual populate. Remember that this is not enough to show in queries. We have to also .populate()
userSchema.virtual('recipes', {
    ref: 'Recipe',
    foreignField: 'author',
    localField: '_id'
});

userSchema.virtual('collections', {
    ref: 'Collection',
    foreignField: 'author',
    localField: '_id'
});

userSchema.pre('save', async function(this: any, next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // Delete passwordConfirm
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', async function(this: any, next) {
    if (!this.isModified('password') || this.isNew) return next();

    // We are subtracting a second to ensure that the token is created AFTER the password has been changed
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function(this: any, next) {
    // This points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// One source of truth for instance methods (done this way for easier typescript typing)
const userInstanceMethods = {
    async correctPassword(this: any, candidatePassword: string, userPassword: string) {
        return bcrypt.compare(candidatePassword, userPassword);
    },

    changedPasswordAfter(this: any, JWTTimestamp: number) {
        if (!this.passwordChangedAt) return false;

        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changedTimestamp;
    },

    createPasswordResetToken(this: any) {
        const minutesUntilExpire = 10;
        const { rawToken, hashedToken, expiresAt } = generateToken({ minutes: minutesUntilExpire });

        this.passwordResetTokenHash = hashedToken;
        this.passwordResetExpires = expiresAt;

        return { rawToken, minutesUntilExpire };
    },

    createSignupEmailVerificationToken(this: any) {
        const minutesUntilExpire = 45;
        const { rawToken, hashedToken, expiresAt } = generateToken({ minutes: minutesUntilExpire });

        this.signupEmailTokenHash = hashedToken;
        this.signupEmailTokenExpires = expiresAt;

        return { rawToken, minutesUntilExpire };
    },

    createPendingEmailVerificationToken(this: any) {
        const minutesUntilExpire = 45;
        const { rawToken, hashedToken, expiresAt } = generateToken({ minutes: minutesUntilExpire });

        this.pendingEmailTokenHash = hashedToken;
        this.pendingEmailTokenExpires = expiresAt;

        return { rawToken, minutesUntilExpire };
    },

    async updateEmailAddressWithPending(this: any) {
        const accountWasPreviouslyVerified = !!this.verifiedAt;

        this.email = this.pendingEmail;
        this.pendingEmail = undefined;
        this.pendingEmailTokenHash = undefined;
        this.pendingEmailTokenExpires = undefined;
        this.verifiedAt = new Date();

        this.signupEmailTokenHash = undefined;
        this.signupEmailTokenExpires = undefined;

        await this.save();
        return accountWasPreviouslyVerified;
    },
};

// Apply the methods to schema
userSchema.methods = userInstanceMethods;

// Plain DB shape (no mongoose methods, no _id)
type UserDbRaw = InferSchemaType<typeof userSchema>;

type UserInstanceMethods = typeof userInstanceMethods;

// Everything is allowed to be undefined in code
type UserDb = Partial<UserDbRaw>;

// Hydrated Mongoose document (what queries actually return)
export type UserDoc = HydratedDocument<UserDbRaw> & UserDb & UserInstanceMethods;

// Domain / API type: plain object + `id: string`. This is what is the API expects
export type User = UserDb & { id: string };

// The model
export const UserModel = model<UserDbRaw>("User", userSchema);