var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var postSetSchema = new Schema({
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    },
    queuedFrom: String,
    caption: String,
    clearCaption: Boolean,
    postCount: {
        start: Number,
        now: Number
    }
});

module.exports = mongoose.model('PostSet', postSetSchema);
