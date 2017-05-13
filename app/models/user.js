import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;
const SALT_WORK_FACTOR = 10;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    tokenSet: [{
        type: Schema.Types.ObjectId,
        ref: 'TokenSet'
    }],
    plan: {
        type: Schema.Types.ObjectId,
        ref: 'Plan',
        default: '5915b29ecc79a276b591b817' // @TODO: Make this use the config
    },
    apiKey: {
        type: String,
        default: ''
    },
    inviteToken: String,
    isAdmin: {
        type: Boolean,
        default: false
    }
});

// Bcrypt middleware
userSchema.pre('save', function(next) {
    const user = this;

    if (!user.isModified('password')) {
        return next();
    }

    bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

userSchema.pre('save', function(next) {
    const user = this;
    if (!user.apiKey.length === 16) {
        user.apiKey = crypto.createHmac('sha1', crypto.randomBytes(16)).update(crypto.randomBytes(16)).digest('hex');
    }
    next();
});

// Password verification
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

export default mongoose.model('User', userSchema);
