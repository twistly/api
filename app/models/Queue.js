var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var queueSchema = new Schema({
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

module.exports = mongoose.model('Queue', queueSchema);
