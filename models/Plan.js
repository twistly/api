var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var planSchema = new mongoose.Schema({
    costPerMonth: Number,
    currency: String,
    maxPosts: Number,
    blogsPerAccount: Number
});

module.exports = mongoose.model('Plan', planSchema);
