import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Queue = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    blogs: [{
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    }],
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
    name: String,
    enabled: {
        type: Boolean,
        default: true
    },
    interval: Number,
    startTime: Number, // 0 is midnight that morning, 86400000 is midnight that night
    endTime: Number,    // This applies to both start and end times
    lastRun: Date
});

export default mongoose.model('Queue', Queue);
