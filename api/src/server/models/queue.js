import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Queue = new Schema({
    blogs: [{
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    }],
    interval: Number,
    startHour: Number,
    endHour: Number
});

export default mongoose.model('Queue', Queue);
