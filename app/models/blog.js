import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const blogSchema = new Schema({
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
    },
    notifications: [{
        type: Schema.Types.ObjectId,
        ref: 'Notification'
    }]
});

export default mongoose.model('Blog', blogSchema);
