const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const validator = require('validator');
//const Recipe = require('./recipeModel')

const userSchema = new mongoose.Schema({
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
            validator: function(el) {
                return el === this.password;
            },
            message: "Passwords are not the same."
        }
    },
    email: {
        type: String,
        required: [true, 'Please provide your email.'],
        unique: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail, 
            message: props => `${props.value} is not a valid email address.`
        }
    },
    passwordChangedAt: {
        type: Date,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
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

userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // Delete passwordConfirm
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.isNew) return next();

    // We are subtracting a second to ensure that the token is created AFTER the password has been changed
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function(next) {
    // This points to the current query
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    // false means NOT changed
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 10 mins
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;