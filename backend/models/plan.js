import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Plan = new Schema({
    costPerMonth: Number,
    currency: String,
    maxPosts: Number,
    blogsPerAccount: Number,
    name: String
});

export default mongoose.model('Plan', Plan);
