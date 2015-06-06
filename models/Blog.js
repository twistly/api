var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var blogSchema = new Schema({
    url: {
        required: true,
        type: String
    },
    postCount: Number,
    isNsfw: Boolean,
    followerCount: Number,
    primary: Boolean,
    public: Boolean,
    postsInQueue: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Blog', blogSchema);
