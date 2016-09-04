var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PostSet = require('./PostSet.js');

var postSchema = new mongoose.Schema({
    postId: String,
    postOrder: Number,
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    },
    reblogKey: String,
    caption: {
        type: String,
        default: ''
    },
    clearCaption: {
        type: Boolean,
        default: false
    }
});

postSchema.pre('remove', function(next) {
    PostSet.update({
        posts: this._id
    }, {
        $pull: {
            posts: this._id
        },
        $inc: {
            'postCount.now': -1
        }
    }, {
        multi: true
    }).exec();
    next();
});

module.exports = mongoose.model('Post', postSchema);
