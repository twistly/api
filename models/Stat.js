var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var statSchema = new mongoose.Schema({
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'Blog'
    },
    followerCount: Number,
    postCount: Number,
    time: {
        year: Number,
        month: Number,
        date: Number,
        hour: Number
    }
});

module.exports = mongoose.model('Stat', statSchema);
