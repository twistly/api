const express = require('express');
const async = require('async');
const User = require('../models/user.js');
const Blog = require('../models/blog.js');
const Notification = require('../models/notification.js');
const PostSet = require('../models/post-set.js');
const Post = require('../models/post.js');

module.exports = (function() {
    var app = new express.Router();

    app.all('/api/*', function(req, res, next) {
        const apiKey = req.body.apiKey || req.query.apiKey;
        if (req.user) {
            return next();
        }
        if (apiKey) {
            User.findOne({
                apiKey: apiKey
            }).populate('tokenSet').populate('plan').exec(function(err, user) {
                if (err) {
                    return res.send({
                        error: err
                    });
                }
                if (user) {
                    req.user = user;
                    return next();
                }
                return res.send({
                    error: 'Api key is invalid'
                });
            });
        } else {
            return res.sendStatus(401);
        }
    });

    app.get('/api/apiKey', function(req, res) {
        return res.send({
            apiKey: req.user.apiKey
        });
    });

    app.post('/api/posts', function(req, res) {
        const blogUrl = req.body.blogUrl;
        const posts = req.body.posts;
        const queuedFrom = req.body.queuedFrom;

        function doesUserHaveBlog (user, blogUrl) {
            for (var i = 0; i < user.tokenSet.length; i++) {
                for (var j = 0; j < user.tokenSet[i].blogs.length; j++) {
                    if (user.tokenSet[i].blogs[j].url.toLowerCase() === blogUrl.toLowerCase()) {
                        return true;
                    }
                }
            }
        }

        async.each(req.user.tokenSet, function (tokenSet, callback) {
            tokenSet.populate({
                path: 'blogs'
            }, function (err) {
                if (err) {
                    callback(err);
                }
                async.each(tokenSet.blogs, function (blog, callback) { // eslint-disable-line max-nested-callbacks
                    blog.populate({
                        path: 'notifications'
                    }, function(err) { // eslint-disable-line max-nested-callbacks
                        if (err) {
                            callback(err);
                        }
                        callback();
                    });
                }, function (err) { // eslint-disable-line max-nested-callbacks
                    if (err) {
                        callback(err);
                    }
                    callback();
                });
            });
        }, function (err) {
            if (err) {
                console.log(err);
            }
            if (doesUserHaveBlog(req.user, blogUrl)) {
                Blog.findOne({
                    url: blogUrl
                }, function(err, blog) { // eslint-disable-line max-nested-callbacks
                    if (err) {
                        console.log(err);
                    }
                    if (blog) {
                        if (blog.postsInQueue >= req.user.plan.maxPosts || blog.postsInQueue + posts.length >= req.user.plan.maxPosts) {
                            res.send({
                                error: 'You can only have ' + req.user.plan.maxPosts + ' posts in your queue, you currently have ' + blog.postsInQueue
                            });
                        } else {
                            var newPosts = [];
                            for (var id in posts) {
                                if ({}.hasOwnProperty.call(posts, id)) {
                                    var post = new Post({
                                        blogId: blog.id,
                                        postId: id,
                                        reblogKey: posts[id].reblogKey
                                    });
                                    post.save();
                                    newPosts.push(post.toObject());
                                }
                            }
                            var notification = new Notification({
                                blogUrl: queuedFrom,
                                content: blog.url + ' queued ' + newPosts.length + ' from ' + queuedFrom,
                                read: false
                            });
                            notification.save(function(err, notification) { // eslint-disable-line max-nested-callbacks
                                if (err) {
                                    console.log(err);
                                }
                                Blog.findOne({
                                    url: queuedFrom
                                }, function(err, queuedFromBlog) { // eslint-disable-line max-nested-callbacks
                                    if (err) {
                                        console.log(err);
                                    }
                                    if (queuedFromBlog) {
                                        queuedFromBlog.notifications.push(notification.id);
                                    }
                                    blog.postsInQueue += newPosts.length;
                                    blog.notifications.push(notification.id);
                                    blog.save();
                                    var postSet = new PostSet({
                                        posts: newPosts,
                                        blogId: blog.id,
                                        queuedFrom: queuedFrom,
                                        clearCaption: false,
                                        postCount: {
                                            start: newPosts.length,
                                            now: newPosts.length
                                        }
                                    });
                                    postSet.save(function(err, postSet) { // eslint-disable-line max-nested-callbacks
                                        if (err) {
                                            console.log(err);
                                        }
                                        res.send({
                                            ok: 'okay',
                                            postSet: postSet
                                        });
                                    });
                                });
                            });
                        }
                    } else {
                        res.send({
                            error: 'We misplaced your blogs?'
                        });
                    }
                });
            } else {
                res.send({
                    error: 'That blog isn\'t listed on your account'
                });
            }
        });
    });

    app.get('/api/blogs', function(req, res, next) {
        async.each(req.user.tokenSet, function (tokenSet, callback) {
            tokenSet.populate({
                path: 'blogs'
            }, function (err) { // eslint-disable-line max-nested-callbacks
                if (err) {
                    console.log(err);
                }
                async.each(tokenSet.blogs, function (blog, callback) { // eslint-disable-line max-nested-callbacks
                    blog.populate({
                        path: 'notifications'
                    }, function(err, result) { // eslint-disable-line max-nested-callbacks
                        if (err) {
                            callback(err);
                        }
                        if (result) {
                            callback();
                        }
                    });
                }, function (err) { // eslint-disable-line max-nested-callbacks
                    if (err) {
                        callback(err);
                    }
                    callback();
                });
            });
        }, function (err) {
            if (err) {
                next(err);
            }
            var blogs = [];
            if (req.user.tokenSet.length) {
                for (var i = 0; i < req.user.tokenSet.length; i++) {
                    for (var k = 0; k < req.user.tokenSet[i].blogs.length; k++) {
                        var blog = req.user.tokenSet[i].blogs[k];
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
    });

    return app;
})();
