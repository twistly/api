const express = require('express'); // eslint-disable-line max-lines
const passport = require('passport');
const async = require('async');
const User = require('../models/User.js');
const Blog = require('../models/Blog.js');
const Post = require('../models/Post.js');
const PostSet = require('../models/PostSet.js');
const TokenSet = require('../models/TokenSet.js');
const Invite = require('../models/Invite.js');
const Notification = require('../models/Notification.js');
const Stat = require('../models/Stat.js');

module.exports = (function() {
    var app = new express.Router();

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        async.parallel([
            function(callback) {
                Post.count({}, function(err, postCount) {
                    if (err) {
                        callback(err);
                    }
                    callback(null, postCount);
                });
            },
            function(callback) {
                User.count({}, function(err, userCount) {
                    if (err) {
                        callback(err);
                    }
                    callback(null, userCount);
                });
            }
        ],
        function(err, results) {
            if (err) {
                console.log(err);
            }
            res.render('comingSoon', {
                postsQueued: results[0],
                users: results[1]
            });
        });
    }

    app.get('*', function(req, res, next) {
        res.locals.title = 'Xtend';
        res.locals.numeral = require('numeral');

        return next();
    });

    app.get('/', ensureAuthenticated, function(req, res) {
        res.render('index');
    });

    app.get('/account', ensureAuthenticated, function(req, res) {
        res.render('account');
    });

    app.get('/user', ensureAuthenticated, function(req, res) {
        res.send(req.user);
    });

    app.get('/activity', ensureAuthenticated, function(req, res) {
        var blogs = [];
        async.each(req.user.tokenSet, function(tokenSet, callback) {
            async.each(tokenSet.blogs, function(blog, callback) {
                blogs.push({
                    blogId: blog.id
                });
                callback();
            });
            callback();
        });
        PostSet.find({
            $or: blogs
        }).limit(50).sort('-_id').lean().populate('blogId').exec(function(err, postSets) {
            if (err) {
                res.send(err);
            }
            res.render('activity', {
                postSets: postSets
            });
        });
    });

    app.get('/unlink/:tokenSetId', ensureAuthenticated, function(req, res, next) {
        User.findOne({
            _id: req.user.id,
            tokenSet: req.params.tokenSetId
        }).exec(function(err, user) {
            if (err) {
                console.log(err);
            }
            if (user) {
                TokenSet.findOne({
                    _id: req.params.tokenSetId
                }, function(err, tokenSet) {
                    if (err) {
                        console.log(err);
                    }
                    if (tokenSet) {
                        async.eachSeries(tokenSet.blogs, function(blog, callback) {
                            Blog.findByIdAndRemove(blog, function(err, doc) {  // eslint-disable-line max-nested-callbacks
                                if (err) {
                                    console.log(err);
                                }
                                if (doc) {
                                    callback();
                                }
                            });
                        }, function () {
                            tokenSet.remove(function(err) {  // eslint-disable-line max-nested-callbacks
                                if (err) {
                                    next(err);
                                }
                                res.redirect('/');
                            });
                        });
                    }
                });
            } else {
                res.send('You don\'t have that token, what do you think you\'re trying to do?');
            }
        });
    });

    app.get('/auth/tumblr', ensureAuthenticated, passport.authenticate('tumblr', {
        callbackURL: '/auth/tumblr/callback'
    }), function(req, res) {
        res.send('??');
    });

    app.get('/auth/tumblr/callback', ensureAuthenticated, function(req, res, next) {
        req._passport.instance.authenticate('tumblr', function(err, user, info) {
            if (err) {
                res.send(err);
            }
            const token = info.token;
            const tokenSecret = info.tokenSecret;
            let blogs = info.tumblr._json.response.user.blogs;
            User.findOne({
                _id: req.user.id
            }, function(err, user) {
                if (err) {
                    console.log(err);
                }
                if (user) {
                    Blog.findOne({
                        url: blogs[0].name
                    }).exec(function(err, blog) {
                        if (err) {
                            console.log(err);
                        }
                        if (blog) {
                            TokenSet.findOne({
                                blogs: blog.id
                            }, function(err, tokenSet) {  // eslint-disable-line max-nested-callbacks
                                if (err) {
                                    console.log(err);
                                }
                                if (tokenSet) {
                                    tokenSet.token = token;
                                    tokenSet.tokenSecret = tokenSecret;
                                    tokenSet.enabled = true;
                                    tokenSet.errorMessage = undefined;
                                    User.findOne({
                                        _id: req.user.id,
                                        tokenSet: tokenSet.id
                                    }, function(err, tokenUser) {  // eslint-disable-line max-nested-callbacks
                                        if (err) {
                                            console.log(err);
                                        }
                                        if (tokenUser) {
                                            tokenSet.save(function(err, tokenSet) {  // eslint-disable-line max-nested-callbacks
                                                if (err) {
                                                    next(err);
                                                }
                                                if (tokenSet) {
                                                    res.redirect('/');
                                                }
                                            });
                                        } else {
                                            user.tokenSet.push(tokenSet.id);
                                            user.save(function(err, user) {  // eslint-disable-line max-nested-callbacks
                                                if (err) {
                                                    next(err);
                                                }
                                                if (user) {
                                                    tokenSet.save(function(err, tokenSet) {  // eslint-disable-line max-nested-callbacks
                                                        if (err) {
                                                            next(err);
                                                        }
                                                        if (tokenSet) {
                                                            res.redirect('/');
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    res.send('Oops? That wasn\'t meant to happen at all!');
                                }
                            });
                        } else {
                            TokenSet.create({
                                token: token,
                                tokenSecret: tokenSecret
                            }, function (err, tokenSet) { // eslint-disable-line max-nested-callbacks
                                if (err) {
                                    console.log(err);
                                }
                                async.eachSeries(blogs, function(blog, callback) { // eslint-disable-line max-nested-callbacks
                                    Notification.find({
                                        blogUrl: blog.name
                                    }, function(err, notifications) { // eslint-disable-line max-nested-callbacks
                                        if (err) {
                                            console.log(err);
                                        }
                                        var newBlog = new Blog({
                                            url: blog.name,
                                            postCount: blog.posts,
                                            isNsfw: blog.is_nsfw, // jshint ignore:line
                                            followerCount: blog.followers,
                                            primary: blog.primary,
                                            public: (blog.type === 'public'),
                                            notifications: notifications
                                        });
                                        newBlog.save(function(err, blog) { // eslint-disable-line max-nested-callbacks
                                            if (err) {
                                                console.log(err);
                                            }
                                            if (blog) {
                                                var now = new Date();
                                                var stat = new Stat({
                                                    blogId: blog._id,
                                                    followerCount: blog.followerCount,
                                                    postCount: blog.postCount,
                                                    time: {
                                                        year: now.getFullYear(),
                                                        month: now.getMonth(),
                                                        date: now.getDate(),
                                                        hour: now.getHours()
                                                    }
                                                });
                                                stat.save();
                                                tokenSet.blogs = tokenSet.blogs.toObject().concat([blog._id]);
                                                tokenSet.save(function(err, tokenSet) { // eslint-disable-line max-nested-callbacks
                                                    if (err) {
                                                        next(err);
                                                    }
                                                    if (tokenSet) {
                                                        callback();
                                                    }
                                                });
                                            } else {
                                                console.log('NO BLOG???');
                                            }
                                        });
                                    });
                                }, function () { // eslint-disable-line max-nested-callbacks
                                    user.tokenSet.push(tokenSet.id);
                                    user.save(function(err, user) { // eslint-disable-line max-nested-callbacks
                                        if (err) {
                                            next(err);
                                        }
                                        if (user) {
                                            res.redirect('/');
                                        }
                                    });
                                });
                            });
                        }
                    });
                } else {
                    res.redirect('/');
                }
            });
        })(req, res);
    });

    app.get('/genToken', ensureAuthenticated, function(req, res, next) {
        if (req.user.isAdmin) {
            Invite.create({
                token: (function() {
                    // http://stackoverflow.com/questions/9719570/generate-random-password-string-with-requirements-in-javascript
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
                    const stringLength = 16;
                    let randomString = '';
                    let charCount = 0;
                    let numCount = 0;
                    let rnum = 0;

                    for (var i = 0; i < stringLength; i++) {
                        // If random bit is 0, there are less than 3 digits already saved, and there are not already 5 characters saved, generate a numeric value.
                        if (((Math.floor(Math.random() * 2) === 0) && numCount < 3) || charCount >= 5) {
                            rnum = Math.floor(Math.random() * 10);
                            randomString += rnum;
                            numCount += 1;
                        } else {
                            // If any of the above criteria fail, go ahead and generate an alpha character from the chars string
                            rnum = Math.floor(Math.random() * chars.length);
                            randomString += chars.substring(rnum, rnum + 1);
                            charCount += 1;
                        }
                    }
                    return randomString;
                })(),
                used: false
            }, function(err, invite) {
                if (err) {
                    console.log(err);
                }
                res.send(invite);
            });
        } else {
            next();
        }
    });

    app.get('/unusedTokens', ensureAuthenticated, function(req, res, next) {
        if (req.user.isAdmin) {
            Invite.find({
                used: false
            }).select('token').exec(function(err, invites) {
                if (err) {
                    console.log(err);
                }
                res.send({
                    count: invites.length,
                    invites: invites
                });
            });
        } else {
            next();
        }
    });

    app.get('/userCount', ensureAuthenticated, function(req, res, next) {
        if (req.user.isAdmin) {
            User.count(function(err, userCount) {
                if (err) {
                    console.log(err);
                }
                res.send({
                    userCount: userCount
                });
            });
        } else {
            next();
        }
    });

    return app;
})();
