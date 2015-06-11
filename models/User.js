var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10;

var userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true},
    tokenSet: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TokenSet'
    }],
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        default: "557285540cc0a43e00d2ba13"
    },
    apiKey: {
        type: String,
        default: ''
    }
});

// Bcrypt middleware
userSchema.pre('save', function(next){
    var user = this;

    if(!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});

userSchema.pre('save', function(next){
    var user = this;
    if(!user.apiKey.length){
        var crypto = require('crypto');
        user.apiKey = crypto.createHmac('sha1', crypto.randomBytes(16)).update(crypto.randomBytes(16)).digest('hex');
    }
    next();
});

// Password verification
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if(err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', userSchema);
