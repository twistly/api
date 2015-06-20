var express  = require('express'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    async = require('async'),
    _ = require('underscore'),
    User  = require('../models/User'),
    Blog  = require('../models/Blog'),
    Post  = require('../models/Post'),
    Queue  = require('../models/Queue'),
    TokenSet  = require('../models/TokenSet'),
    Notification = require('../models/Notification'),
    Stat = require('../models/Stat');

module.exports = (function() {
    var app = express.Router();

    app.get('*', function(req, res, next){
        if (!req.isAuthenticated()) res.redirect('/signin');
        res.locals.title = 'Xtend';
        return next();
    });

    app.get('/', function(req, res){
        res.render('index');
    });

    app.get('/account', function(req, res){
        res.render('account');
    });

    app.get('/user', function(req, res){
        res.send(req.user);
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
                res.send('You don\'t have that token, what do you think you\'re trying to do?')
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

    return app;
})();
