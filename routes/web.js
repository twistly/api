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
    TokenSet  = require('../models/TokenSet');

module.exports = (function() {
    var app = express.Router();

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/signin')
    }

    app.get('/', function(req, res){
        if(req.user){
            res.render('index');
        } else {
            res.redirect('/signin');
        }
    });

    app.get('/account', ensureAuthenticated, function(req, res){
        res.render('account');
    });

    app.get('/unlink/:tokenSetId', ensureAuthenticated, function(req, res){
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

    app.get('/auth/tumblr', ensureAuthenticated, passport.authenticate('tumblr', { callbackURL: '/auth/tumblr/callback'}), function(req, res){
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
                                    var newBlog = new Blog({
                                        url: blog.name,
                                        postCount: blog.posts,
                                        isNsfw: blog.is_nsfw,
                                        followerCount: blog.followers,
                                        primary: blog.primary,
                                        public: (blog.type == 'public')
                                    });
                                    newBlog.save(function(err, blog) {
                                        if(err) console.log(err);
                                        if(blog){
                                            tokenSet.blogs = tokenSet.blogs.toObject().concat([blog._id]);
                                            tokenSet.save(function(err, tokenSet){
                                                callback();
                                            });
                                        } else {
                                            console.log('NO BLOG???');
                                        }
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
