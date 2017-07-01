import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Plan = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    cost: {
        type: Number,
        min: 0,
        max: 50
    },
    currency: {
        type: String,
        enum: ['USD', 'AUD']
    },
    tumblr: {
        // The limits field effects the maxPosts limit
        maxBlogs: Number,
        maxPosts: Number,
        limits: {
            type: String,
            enum: ['ACCOUNT', 'BLOG']
        }
    }
});

export default mongoose.model('Plan', Plan);
