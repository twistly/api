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
    public: Boolean
});

module.exports = mongoose.model('Blog', blogSchema);
