var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var notificationSchema = new Schema({
    blogUrl: String,
    content: String,
    read: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
