import mongoose from 'mongoose';

const Schema = mongoose.Schema;

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

export default mongoose.model('Post', Post);
