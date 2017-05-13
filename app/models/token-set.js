import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const User = require('./user.js');

const tokenSetSchema = new Schema({
    token: {
        required: true,
        type: String
    },
    tokenSecret: {
        required: true,
        type: String
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

tokenSetSchema.pre('remove', function(next) {
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

export default mongoose.model('TokenSet', tokenSetSchema);
