import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const queueSchema = new Schema({
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    },
    lastRun: {
        type: Date,
        default: Date.now
    },
    interval: Number,
    startHour: Number,
    endHour: Number,
    backfill: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('Queue', queueSchema);
