var express  = require('express'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    async = require('async'),
    User  = require('../models/User');

module.exports = (function() {
    var app = express.Router();

    app.post('/api/posts', function(req, res){
        var blogUrl = req.body.blogUrl,
            posts = req.body.posts,
            apiKey = req.body.apiKey;

        function doesUserHaveBlog (user, blogUrl){
            for (var i = 0; i < user.tokenSet.length;i++){
                for (var j = 0; j < user.tokenSet[i].blogs.length;j++){
                    if(user.tokenSet[i].blogs[j].url.toLowerCase() == blogUrl.toLowerCase()) return true;
                }
            }
        }

        User.findOne({ apiKey: apiKey }).populate('tokenSet').populate('plan').exec(function(err, user){
            if(err) res.send({error: err});
            if(user){
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
                    if(doesUserHaveBlog(user, blogUrl)){
                        res.send({
                            ok: 'okay',
                            posts: posts
                        });
                    } else {
                        res.send({
                            error: 'That blog isn\'t listed on your account'
                        });
                    }
                });
            } else {
                res.send({
                    error: 'Api key is invalid'
                });
            }
        });
    });

    app.get('/api/blogs', function(req, res){
        var apiKey = req.query.apiKey;
        User.findOne({ apiKey: apiKey }).populate('tokenSet').populate('plan').exec(function(err, user){
            if(err) res.send({error: err});
            if(user){
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
                    var blogs = [];
                    if(user.tokenSet.length){
                        for(var i = 0; i < user.tokenSet.length; i++){
                            for(var k = 0; k < user.tokenSet[i].blogs.length; k++){
                                var blog = user.tokenSet[i].blogs[k];
                                blogs.push({
                                    url: blog.url,
                                    postCount: blog.postCount,
                                    followerCount: blog.followerCount
                                });
                            }
                        }
                        res.send({
                            ok: 'okay',
                            blogs: blogs
                        });
                    } else {
                        res.send({
                            error: 'No blogs found',
                            blogs: blogs
                        });
                    }
                });
            } else {
                res.send({
                    error: 'Api key is invalid'
                });
            }
        });
    });

    return app;
 })();
