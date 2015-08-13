var mongoose = require('mongoose');

var inviteSchema = mongoose.Schema({
    token: {
        type: String,
        unique: true
    },
    used: Boolean
});

module.exports = mongoose.model('Invite', inviteSchema);
