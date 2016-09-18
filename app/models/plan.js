var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var planSchema = new Schema({
    costPerMonth: Number,
    currency: String,
    maxPosts: Number,
    blogsPerAccount: Number,
    name: String
});

module.exports = mongoose.model('Plan', planSchema);
