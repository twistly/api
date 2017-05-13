import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const statSchema = new Schema({
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

export default mongoose.model('Stat', statSchema);
