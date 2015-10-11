var express  = require('express'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    async = require('async'),
    _ = require('underscore'),
    User = require('../models/User'),
    Blog = require('../models/Blog'),
    Post = require('../models/Post'),
    PostSet = require('../models/PostSet'),
    Queue = require('../models/Queue'),
    TokenSet = require('../models/TokenSet'),
    Invite = require('../models/Invite'),
    Notification = require('../models/Notification'),
    Stat = require('../models/Stat');

module.exports = (function() {
    var app = express.Router();

    app.get('*', function(req, res, next){
        res.locals.title = 'Xtend';
        return next();
    });

    app.get('/', function(req, res){
        if (!req.isAuthenticated()){
            async.parallel([
                function(callback){
                    Post.count({}, function(err, postCount){
                        if(err) callback(err);
                        callback(null, postCount);
                    });
                },
                function(callback){
                    User.count({}, function(err, userCount){
                        if(err) callback(err);
                        callback(null, userCount);
                    });
                }
            ],
            function(err, results){
                if(err) console.log(err);
                res.render('comingSoon', {
                    postsQueued: results[0],
                    users: results[1]
                });
            });
        } else {
            res.render('index');
        }
    });

    app.get('*', function(req, res, next){
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/');
    });

    app.get('/account', function(req, res){
        res.render('account');
    });

    app.get('/user', function(req, res){
        res.send(req.user);
    });

    app.get('/activity', function(req, res){
        var blogs = [];
        async.each(req.user.tokenSet, function (tokenSet, callback) {
            async.each(tokenSet.blogs, function (blog, callback) {
                blogs.push({
                    blogId: blog.id
                });
            });
        });
        PostSet.find({ $or: blogs}).limit(50).sort('-_id').populate('blogId posts').exec(function(err, postSets){
            if(err) res.send(err);
            res.render('activity', {
                postSets: postSets
            });
        });
    });

    app.get('/unlink/:tokenSetId', function(req, res){
        User.findOne({_id: req.user.id, tokenSet: req.params.tokenSetId}).exec(function(err, user){
            if(err) console.log(err);
            if(user){
                TokenSet.findOne({_id: req.params.tokenSetId}, function(err, tokenSet){
                    if(err) console.log(err);
                    if(tokenSet) {
                        async.eachSeries(tokenSet.blogs, function(blog, callback) {
                            Blog.findByIdAndRemove(blog, function(err, doc){
                                if(err) console.log(err);
                                callback();
                            });
                        }, function () {
                            tokenSet.remove(function(err){
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

    app.get('/auth/tumblr', passport.authenticate('tumblr', { callbackURL: '/auth/tumblr/callback'}), function(req, res){
        res.send('??');
    });

    app.get('/auth/tumblr/callback', function(req, res) {
        req._passport.instance.authenticate('tumblr', function(err, user, info) {
            if(err) res.send(err);
            var token = info.token;
                tokenSecret = info.tokenSecret,
                blogs = info.tumblr._json.response.user.blogs;
            User.findOne({_id: req.user.id}, function(err, user){
                if(err) console.log(err);
                if(user){
                    Blog.findOne({url: blogs[0].name}).exec(function(err, blog){
                        if(err) console.log(err);
                        if(blog){
                            TokenSet.findOne({blogs: blog.id}, function(err, tokenSet){
                                if(err) console.log(err);
                                if(tokenSet){
                                    tokenSet.token = token;
                                    tokenSet.tokenSecret = tokenSecret;
                                    User.findOne({_id: req.user.id, tokenSet: tokenSet.id}, function(err, tokenUser){
                                        if(tokenUser){
                                            tokenSet.save(function(err, tokenSet){
                                                res.redirect('/');
                                            });
                                        } else {
                                            user.tokenSet.push(tokenSet.id);
                                            user.save(function(err, user){
                                                tokenSet.save(function(err, tokenSet){
                                                    res.redirect('/');
                                                });
                                            });
                                        }
                                    });
                                } else {
                                    res.send('Oops? That wasn\'t meant to happen at all!');
                                }
                            });
                        } else {
                            TokenSet.create({ token: token, tokenSecret: tokenSecret }, function (err, tokenSet) {
                                if(err) console.log(err);
                                async.eachSeries(blogs, function(blog, callback) {
                                    Notification.find({blogUrl: blog.name}, function(err, notifications){
                                        if(err) console.log(err);
                                        var newBlog = new Blog({
                                            url: blog.name,
                                            postCount: blog.posts,
                                            isNsfw: blog.is_nsfw,
                                            followerCount: blog.followers,
                                            primary: blog.primary,
                                            public: (blog.type == 'public'),
                                            notifications: notifications
                                        });
                                        newBlog.save(function(err, blog) {
                                            if(err) console.log(err);
                                            if(blog){
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
                                                tokenSet.save(function(err, tokenSet){
                                                    callback();
                                                });
                                            } else {
                                                console.log('NO BLOG???');
                                            }
                                        });
                                    });
                                }, function () {
                                    user.tokenSet.push(tokenSet.id);
                                    user.save(function(err, user){
                                        res.redirect('/');
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

    app.get('/genToken', function(req, res, next){
        if(req.user.isAdmin){
            Invite.create({token: (function(){
                // http://stackoverflow.com/questions/9719570/generate-random-password-string-with-requirements-in-javascript
                var chars = string || "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789",
                    stringLength = length || 16,
                    randomString = '',
                    charCount = 0,
                    numCount = 0,
                    rnum = 0;

                for (var i = 0; i < stringLength; i++) {
                    // If random bit is 0, there are less than 3 digits already saved, and there are not already 5 characters saved, generate a numeric value.
                    if((Math.floor(Math.random() * 2) === 0) && numCount < 3 || charCount >= 5) {
                        rnum = Math.floor(Math.random() * 10);
                        randomString += rnum;
                        numCount += 1;
                    } else {
                        // If any of the above criteria fail, go ahead and generate an alpha character from the chars string
                        rnum = Math.floor(Math.random() * chars.length);
                        randomString += chars.substring(rnum,rnum+1);
                        charCount += 1;
                    }
                }
                return randomString;
            })(), used: false}, function(err, invite){
                res.send(invite);
            });
        } else {
            next();
        }
    });

    app.get('/unusedTokens', function(req, res, next){
        if(req.user.isAdmin){
            Invite.find({used: false}).select('token').exec(function(err, invites){
                res.send({
                    count: invites.length,
                    invites: invites
                });
            });
        } else {
            next();
        }
    });

    return app;
})();
