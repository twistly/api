import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Blog = new Schema({
    url: {
        required: true,
        type: String
    },
    postCount: Number,
    isNsfw: Boolean,
    followerCount: Number,
    primary: Boolean,
    public: Boolean,
    postsInQueue: {
        type: Number,
        default: 0
    }
});

export default mongoose.model('Blog', Blog);
