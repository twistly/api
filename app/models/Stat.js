var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var statSchema = new mongoose.Schema({
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    },
    followerCount: Number,
    postCount: Number,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Stat', statSchema);
