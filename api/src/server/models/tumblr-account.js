import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TumblrAccount = new Schema({
    token: {
        required: true,
        type: String,
        select: false
    },
    secret: {
        required: true,
        type: String,
        select: false
    },
    blogs: [{
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    }],
    enabled: {
        required: true,
        type: Boolean,
        default: true
    },
    error: String
});

export default mongoose.model('TumblrAccount', TumblrAccount);
