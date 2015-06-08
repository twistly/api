var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var notificationSchema = new Schema({
    content: String,
    read: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
