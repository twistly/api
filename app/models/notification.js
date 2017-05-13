import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    blogUrl: String,
    content: String,
    read: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('Notification', notificationSchema);
