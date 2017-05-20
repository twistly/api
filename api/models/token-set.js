import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const User = require('./user.js');

const TokenSet = new Schema({
    token: {
        required: true,
        type: String,
        select: false
    },
    tokenSecret: {
        required: true,
        type: String,
        select: false
    },
    blogs: [{
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    }],
    enabled: {
        required: true,
        type: Boolean,
        default: true
    },
    errorMessage: String,
    lastUpdatedStat: {
        type: Date,
        default: Date.now
    }
});

TokenSet.pre('remove', next => {
    User.update({
        tokenSet: this._id
    }, {
        $pull: {
            tokenSet: this._id
        }
    }, {
        multi: true
    }).exec();
    next();
});

export default mongoose.model('TokenSet', TokenSet);
