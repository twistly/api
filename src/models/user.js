import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
        default: '5915b29ecc79a276b591b817' // @TODO: Make this use the config
    },
    apiKey: String,
    roles: [{
        type: String,
        default: ['user']
    }]
});

User.pre('save', function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    this.password = bcrypt.hashSync(this.password, config.get('bcypt.rounds'));
    next();
});

// Password verification
User.methods.comparePassword = function(password, cb) {
    const hash = this.password;
    bcrypt.compare(password, hash).then(match => cb(null, match)).catch(err => cb(err));
};

export default mongoose.model('User', User);
