import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import hat from 'hat';
import config from '../config';

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
User.methods.comparePassword = function(password, cb) {
    const hash = this.password;
    bcrypt.compare(password, hash).then(match => cb(null, match)).catch(err => cb(err));
};

export default mongoose.model('User', User);
