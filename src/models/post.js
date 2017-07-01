import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Post = new Schema({
    postId: String,
    postOrder: Number,
    reblogKey: String,
    caption: {
        type: String,
        default: ''
    }
});

export default mongoose.model('Post', Post);
