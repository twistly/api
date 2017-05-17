import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Notification = new Schema({
    to: String,
    from: String,
    type: String,
    content: Object,
    read: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('Notification', Notification);
