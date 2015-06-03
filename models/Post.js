var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var postSchema = new mongoose.Schema({
    blogId: Schema.Types.ObjectId,
    postId: Number,
    reblogKey: String,
    caption: String,
    clearCaption: Boolean
});

module.exports = mongoose.model('Post', postSchema);
