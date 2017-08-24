import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Post = new Schema({
    queueId: String,
    postId: String,
    reblogKey: String
});

export default mongoose.model('Post', Post);
