import async from 'async'
import User from '../models/user.js'
import Invite from '../models/invite.js'
import Plan from '../models/plan.js'

export default (app, passport) => {
    const LocalStrategy = require('passport-local').Strategy;
    const TumblrStrategy = require('passport-tumblr').Strategy;

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id).populate('tokenSet').populate('plan').exec((err, user) => {
            if (err) {
                console.log(err);
            }
            async.each(user.tokenSet, (tokenSet, callback) => {
                tokenSet.populate({
                    path: 'blogs'
                }, err => {
                    if (err) {
                        done(err);
                    }
                    async.each(tokenSet.blogs, (blog, callback) => {
                        blog.populate({
                            path: 'notifications'
                        }, err => {
                            if (err) {
                                done(err);
                            }
                            callback();
                        });
                    }, err => {
                        if (err) {
                            done(err);
                        }
                        callback();
                    });
                });
            }, err => {
                done(err, user);
            });
        });
    });

    passport.use('local-signin', new LocalStrategy((username, password, done) => {
        const criteria = (username.indexOf('@') === -1) ? {username} : {email: username};
        User.findOne(criteria, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Unknown user ' + username
                });
            }
            user.comparePassword(password, (err, isMatch) => {
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
        passReqToCallback: true // Allows us to pass back the entire request to the callback
    }, (req, username, password, done) => {
        process.nextTick(() => {
            User.findOne({username}, (err, user) => {
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
                }, (err, invite) => {
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
                        invite.save((err, invite) => {
                            if (err) {
                                console.log(err);
                            }
                            const user = new User({
                                username,
                                email: req.body.email,
                                password,
                                inviteToken: invite.token
                            });
                            user.save((err, user) => {
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
        consumerKey: process.env.TUMBLR_CONSUMER_KEY,
        consumerSecret: process.env.TUMBLR_CONSUMER_SECRET,
        callbackURL: '/auth/tumblr/callback'
    }, (token, tokenSecret, profile, done) => {
        done(null, false, {
            tumblr: profile,
            token,
            tokenSecret
        });
    }));
};
