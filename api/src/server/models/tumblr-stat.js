import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TumblrStat = new Schema({
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

export default mongoose.model('TumblrStat', TumblrStat);
