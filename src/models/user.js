import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import hat from 'hat';
import config from '../config';

const MINUTE = 60 * 1000;
const THIRTY_MINUTES = 30 * MINUTE;

const Schema = mongoose.Schema;

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
    resetCode: {
        type: String,
        required: false
    },
    resetTimestamp: {
        type: String,
        required: false
    },
    tumblr: [{
        type: Schema.Types.ObjectId,
        ref: 'TumblrAccount'
    }],
    plan: {
        type: Schema.Types.ObjectId,
        ref: 'Plan',
        default: config.get('plan')
    },
    apiKey: {
        type: String,
        default: hat()
    },
    roles: [{
        type: String
    }],
    suspended: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

User.pre('save', function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    this.password = bcrypt.hashSync(this.password, config.get('bcypt.rounds'));

    if (this.roles.length === 0 && !this.supended) {
        this.roles.push('user');
    }

    next();
});

// Password verification
User.methods.comparePassword = function(password, callback) {
    const hash = this.password;
    const promise = new Promise((resolve, reject) => {
        bcrypt.compare(password, hash).then(match => resolve(match)).catch(err => reject(err));
    });

    if (callback && typeof callback === 'function') {
        promise.then(callback.bind(null, null), callback);
    }

    return promise;
};

// Run this every time the user interacts with Twistly
User.methods.active = function(callback) {
    const self = this;
    const promise = new Promise((resolve, reject) => {
        self.lastActive = Date.now();
        self.save(err => {
            if (err) {
                reject(err);
            }

            resolve();
        });
    });

    if (callback && typeof callback === 'function') {
        promise.then(callback.bind(null, null), callback);
    }

    return promise;
};

User.methods.resetPassword = function(resetCode, newPassword, callback) {
    const self = this;
    const now = (new Date()).getTime();
    const promise = new Promise((resolve, reject) => {
        if (bcrypt.hashSync(resetCode, config.get('bcypt.rounds')) === self.resetCode) {
            if (self.resetTimestamp > (now + THIRTY_MINUTES)) {
                return reject(new Error('Reset code has expired'));
            }

            self.password = bcrypt.hashSync(newPassword, config.get('bcypt.rounds'));
            return resolve();
        }
        return reject(new Error('Incorrect reset code'));
    });

    if (callback && typeof callback === 'function') {
        promise.then(callback.bind(null, null), callback);
    }

    return promise;
};

export default mongoose.model('User', User);
