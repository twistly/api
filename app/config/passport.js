exports = module.exports = function(app, passport) {
    const LocalStrategy = require('passport-local').Strategy;
    const TumblrStrategy = require('passport-tumblr').Strategy;
    const async = require('async');
    const config = require('cz');
    const path = require('path');
    const User = require('../models/User.js');
    const Invite = require('../models/Invite.js');
    const Plan = require('../models/Plan.js');

    config.load(path.normalize(path.join(__dirname, '/../../config.json')));
    config.args();
    config.store('disk');

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id).populate('tokenSet').populate('plan').exec(function(err, user) {
            if (err) {
                console.log(err);
            }
            async.each(user.tokenSet, function (tokenSet, callback) {
                tokenSet.populate({
                    path: 'blogs'
                }, function (err) {
                    if (err) {
                        done(err);
                    }
                    async.each(tokenSet.blogs, function (blog, callback) { // eslint-disable-line max-nested-callbacks
                        blog.populate({
                            path: 'notifications'
                        }, function(err) { // eslint-disable-line max-nested-callbacks
                            if (err) {
                                done(err);
                            }
                            callback();
                        });
                    }, function (err) { // eslint-disable-line max-nested-callbacks
                        if (err) {
                            done(err);
                        }
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
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Unknown user ' + username
                });
            }
            user.comparePassword(password, function(err, isMatch) {
                if (err) {
                    return done(err);
                }
                if (isMatch) {
                    return done(null, user);
                }
                return done(null, false, {
                    message: 'Invalid password'
                });
            });
        });
    }));

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {
        process.nextTick(function() {
            User.findOne({username: username}, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (user) {
                    return done(null, false, {
                        message: 'That username is already taken.'
                    });
                }

                Invite.findOne({
                    token: req.body.invite
                }, function(err, invite) {
                    if (err) {
                        return done(err);
                    }
                    if (invite) {
                        if (invite.used) {
                            return done(null, false, {
                                message: 'That invite has been used.'
                            });
                        }
                        invite.used = true;
                        invite.save(function(err, invite) {
                            if (err) {
                                console.log(err);
                            }
                            var user = new User({
                                username: username,
                                email: req.body.email,
                                password: password,
                                inviteToken: invite.token
                            });
                            user.save(function(err, user) { // eslint-disable-line max-nested-callbacks
                                if (err) {
                                    return done(err);
                                }
                                return done(null, user);
                            });
                        });
                    } else {
                        return done(null, false, {
                            message: 'That invite token doesn\'t exist.'
                        });
                    }
                });
            });
        });
    }));

    passport.use('tumblr', new TumblrStrategy({
        consumerKey: config.get('tumblr:token'),
        consumerSecret: config.get('tumblr:tokenSecret'),
        callbackURL: '/auth/tumblr/callback'
    },
    function(token, tokenSecret, profile, done) {
        done(null, false, {
            tumblr: profile,
            token: token,
            tokenSecret: tokenSecret
        });
    }));
};
