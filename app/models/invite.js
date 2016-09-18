var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var inviteSchema = new Schema({
    token: {
        type: String,
        unique: true
    },
    used: Boolean
});

module.exports = mongoose.model('Invite', inviteSchema);
