var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var queueSchema = new Schema({
    blogId: Schema.Types.ObjectId,
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

module.exports = mongoose.model('Queue', queueSchema);
