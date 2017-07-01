import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const Schema = mongoose.Schema;
const SALT_WORK_FACTOR = 10;

const User = new Schema({
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
        required: true,
        select: false
    },
    tumblr: [{
        type: Schema.Types.ObjectId,
        ref: 'TumblrAccount'
    }],
    plan: {
        type: Schema.Types.ObjectId,
        ref: 'Plan',
        default: '5915b29ecc79a276b591b817' // @TODO: Make this use the config
    },
    apiKey: String,
    roles: [{
        type: String,
        default: ['user']
    }]
});

// Bcrypt middleware
User.pre('save', function(next) {
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

// Password verification
User.methods.comparePassword = function(password, cb) {
    const hash = this.password;
    bcrypt.compare(password, hash).then(match => cb(null, match)).catch(err => cb(err));
};

export default mongoose.model('User', User);
