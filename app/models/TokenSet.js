var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    User = require('./User.js');

var tokenSetSchema = new Schema({
    token: {
        required: true,
        type: String
    },
    tokenSecret: {
        required: true,
        type: String
    },
    blogs: [{
        type: mongoose.Schema.Types.ObjectId,
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
    User.update({ tokenSet: this._id }, { $pull: { tokenSet: this._id } }, { multi: true }).exec();
    next();
});


module.exports = mongoose.model('TokenSet', tokenSetSchema);
