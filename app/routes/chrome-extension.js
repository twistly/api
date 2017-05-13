const express = require('express');
const async = require('async');
const User = require('../models/user.js');
const Blog = require('../models/blog.js');
const Notification = require('../models/notification.js');
const PostSet = require('../models/post-set.js');
const Post = require('../models/post.js');

module.exports = (function() {
    const app = new express.Router();

    app.all('/api/*', (req, res, next) => {
        const apiKey = req.body.apiKey || req.query.apiKey;
        if (req.user) {
            return next();
        }
        if (apiKey) {
            User.findOne({
                apiKey
            }).populate('tokenSet').populate('plan').exec((err, user) => {
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

    app.get('/api/apiKey', (req, res) => {
        return res.send({
            apiKey: req.user.apiKey
        });
    });

    app.post('/api/posts', (req, res) => {
        const blogUrl = req.body.blogUrl;
        const posts = req.body.posts;
        const queuedFrom = req.body.queuedFrom;

        function doesUserHaveBlog(user, blogUrl) {
            for (let i = 0; i < user.tokenSet.length; i++) {
                for (let j = 0; j < user.tokenSet[i].blogs.length; j++) {
                    if (user.tokenSet[i].blogs[j].url.toLowerCase() === blogUrl.toLowerCase()) {
                        return true;
                    }
                }
            }
        }

        async.each(req.user.tokenSet, (tokenSet, callback) => {
            tokenSet.populate({
                path: 'blogs'
            }, err => {
                if (err) {
                    callback(err);
                }
                async.each(tokenSet.blogs, (blog, callback) => {
                    blog.populate({
                        path: 'notifications'
                    }, err => {
                        if (err) {
                            callback(err);
                        }
                        callback();
                    });
                }, err => {
                    if (err) {
                        callback(err);
                    }
                    callback();
                });
            });
        }, err => {
            if (err) {
                console.log(err);
            }
            if (doesUserHaveBlog(req.user, blogUrl)) {
                Blog.findOne({
                    url: blogUrl
                }, (err, blog) => {
                    if (err) {
                        console.log(err);
                    }
                    if (blog) {
                        if (blog.postsInQueue >= req.user.plan.maxPosts || blog.postsInQueue + posts.length >= req.user.plan.maxPosts) {
                            res.send({
                                error: 'You can only have ' + req.user.plan.maxPosts + ' posts in your queue, you currently have ' + blog.postsInQueue
                            });
                        } else {
                            const newPosts = [];
                            for (const id in posts) {
                                if ({}.hasOwnProperty.call(posts, id)) {
                                    const post = new Post({
                                        blogId: blog.id,
                                        postId: id,
                                        reblogKey: posts[id].reblogKey
                                    });
                                    post.save();
                                    newPosts.push(post.toObject());
                                }
                            }
                            const notification = new Notification({
                                blogUrl: queuedFrom,
                                content: blog.url + ' queued ' + newPosts.length + ' from ' + queuedFrom,
                                read: false
                            });
                            notification.save((err, notification) => {
                                if (err) {
                                    console.log(err);
                                }
                                Blog.findOne({
                                    url: queuedFrom
                                }, (err, queuedFromBlog) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                    if (queuedFromBlog) {
                                        queuedFromBlog.notifications.push(notification.id);
                                    }
                                    blog.postsInQueue += newPosts.length;
                                    blog.notifications.push(notification.id);
                                    blog.save();
                                    const postSet = new PostSet({
                                        posts: newPosts,
                                        blogId: blog.id,
                                        queuedFrom,
                                        clearCaption: false,
                                        postCount: {
                                            start: newPosts.length,
                                            now: newPosts.length
                                        }
                                    });
                                    postSet.save((err, postSet) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        res.send({
                                            ok: 'okay',
                                            postSet
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

    app.get('/api/blogs', (req, res, next) => {
        async.each(req.user.tokenSet, (tokenSet, callback) => {
            tokenSet.populate({
                path: 'blogs'
            }, err => {
                if (err) {
                    console.log(err);
                }
                async.each(tokenSet.blogs, (blog, callback) => {
                    blog.populate({
                        path: 'notifications'
                    }, (err, result) => {
                        if (err) {
                            callback(err);
                        }
                        if (result) {
                            callback();
                        }
                    });
                }, err => {
                    if (err) {
                        callback(err);
                    }
                    callback();
                });
            });
        }, err => {
            if (err) {
                next(err);
            }
            const blogs = [];
            if (req.user.tokenSet.length >= 1) {
                for (let i = 0; i < req.user.tokenSet.length; i++) {
                    for (let k = 0; k < req.user.tokenSet[i].blogs.length; k++) {
                        const blog = req.user.tokenSet[i].blogs[k];
                        blogs.push({
                            url: blog.url,
                            postCount: blog.postCount,
                            followerCount: blog.followerCount
                        });
                    }
                }
                res.send({
                    ok: 'okay',
                    blogs
                });
            } else {
                res.send({
                    error: 'No blogs found',
                    blogs
                });
            }
        });
    });

    return app;
})();
