import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const postSetSchema = new Schema({
    posts: [{
        type: Schema.Types.ObjectId,
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

export default mongoose.model('PostSet', postSetSchema);
