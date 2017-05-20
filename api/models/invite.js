import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Invite = new Schema({
    token: {
        type: String,
        unique: true
    },
    used: Boolean
});

export default mongoose.model('Invite', Invite);
