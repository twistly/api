import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PostSet = require('./post-set.js');

const Post = new Schema({
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

Post.pre('remove', function(next) {
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

export default mongoose.model('Post', Post);
