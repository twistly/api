exports = module.exports = function(app, passport) {
    var bcrypt = require('bcrypt'),
        mongoose = require('mongoose'),
        LocalStrategy = require('passport-local').Strategy,
        TumblrStrategy = require('passport-tumblr').Strategy,
        async = require('async'),
        config = require('./config.js'),
        Blog  = require('./models/Blog'),
        User  = require('./models/User'),
        Plan  = require('./models/Plan'),
        TokenSet  = require('./models/TokenSet'),
        Notification  = require('./models/Notification');

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id).populate('tokenSet').populate('plan').exec(function (err, user) {
            async.each(user.tokenSet, function (tokenSet, callback) {
                tokenSet.populate({path:'blogs'}, function (err, result) {
                    async.each(tokenSet.blogs, function (blog, callback) {
                        blog.populate({path: 'notifications'}, function(err, result){
                            if(err) console.log(err);
                            callback();
                        });
                    }, function (err) {
                        callback();
                    });
                });
            }, function (err) {
                done(err, user);
            });
        });
    });

    passport.use('local-signin', new LocalStrategy(function(username, password, done) {
        var criteria = (username.indexOf('@') === -1) ? {username: username} : {email: username};
        User.findOne(criteria, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
            user.comparePassword(password, function(err, isMatch) {
                if (err) return done(err);
                if(isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Invalid password' });
                }
            });
        });
    }));

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {
        process.nextTick(function() {
            User.findOne({username: username}, function(err, user) {
                if (err) return done(err);
                if (user) {
                    return done(null, false, { message: 'That username is already taken.' });
                } else {
                    var user = new User({
                        username: username,
                        email: req.body.email,
                        password: password
                    });
                    user.save(function(err, user) {
                        if (err) throw err;
                        return done(null, user);
                    });
                }
            });
        });
    }));

    passport.use('tumblr', new TumblrStrategy({
        consumerKey: config.tumblr.token,
        consumerSecret: config.tumblr.tokenSecret,
        callbackURL: "http://192.168.1.158:3000/auth/tumblr/callback"
    },
    function(token, tokenSecret, profile, done) {
        done(null, false, {
            tumblr: profile,
            token: token,
            tokenSecret: tokenSecret
        });
    }));
};
