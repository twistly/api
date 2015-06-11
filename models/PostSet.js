var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Post = require('./Post'),
    Blog = require('./Blog');

var postSetSchema = new Schema({
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    },
    caption: String,
    clearCaption: Boolean,
    postCount: {
        start: Number,
        now: Number
    }
});

module.exports = mongoose.model('PostSet', postSetSchema);
