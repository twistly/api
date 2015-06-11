var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    PostSet = require('./PostSet');

var postSchema = new mongoose.Schema({
    postId: Number,
    reblogKey: String,
    caption: String,
    clearCaption: Boolean
});

postSchema.pre('remove', function(next) {
    PostSet.update({ posts: this._id }, { $pull: { posts: this._id } }, { multi: true }).exec();
    next();
});

module.exports = mongoose.model('Post', postSchema);
