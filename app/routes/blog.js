const path = require('path');
const express = require('express');
const async = require('async');
const config = require('cz');
const Blog = require('../models/Blog.js');
const Post = require('../models/Post.js');
const Queue = require('../models/Queue.js');
const Stat = require('../models/Stat.js');
const PostSet = require('../models/PostSet.js');

config.load(path.normalize(path.join(__dirname, '/../../config.json')));
config.args();
config.store('disk');

module.exports = (function() {
    var app = new express.Router();

    app.get('/blog/:blogUrl/*', function(req, res, next) {
        Blog.findOne({
            url: req.params.blogUrl
        }).lean().exec(function(err, blog) {
            if (err) {
                console.log(err);
            }
            if (blog) {
                req.blog = blog;
                return next();
            }
            // @TODO: Replace this with a 404
            res.render('index');
        });
    });

    app.get('/blog/:blogUrl/stats(?:/public)?', function(req, res) {
        Stat.find({
            blogId: req.blog._id
        }, '-_id -__v -blogId').sort('-date').limit(384).lean().exec(function(err, stats) {
            if (err) {
                console.log(err);
            }
            Stat.findOne({
                blogId: req.blog._id
            }, '-_id -__v -blogId').sort('date').exec(function(err, firstStat) { // eslint-disable-line max-nested-callbacks
                if (err) {
                    console.log(err);
                }
                // This is for the weekly gains and stuff
                var current = stats[0];
                var currentFollowers = current.followerCount;
                var daysBetweenFirstStatAndNow = Math.round(Math.abs((new Date(stats[0].date).getTime() - new Date(firstStat.date).getTime()) / (24 * 60 * 60 * 1000)));
                var gainsPerDay = Math.floor((currentFollowers - firstStat.followerCount) / daysBetweenFirstStatAndNow);
                var lastUpdated = Math.floor((new Date().getTime() - new Date(stats[0].date).getTime()) / 60000);
                res.render('blog/index', {
                    currentBlog: req.blog,
                    stats: stats,
                    statTable: {
                        forecast: {
                            week: currentFollowers + (gainsPerDay * 7),
                            month: currentFollowers + (gainsPerDay * 30),
                            year: currentFollowers + (gainsPerDay * 365)
                        },
                        lastUpdated: lastUpdated < 2 ? 'just now' : lastUpdated + ' minutes ago',
                        currentFollowers: currentFollowers,
                        html: []
                    }
                });
            });
        });
    });

    app.get('/blog/:blogUrl/*', function(req, res, next) {
        // @TODO: Change Schema to remove the need for this nested crap :(
        function isUserAllowed (blogUrl) {
            for (var i = 0; i < req.user.tokenSet.length; i++) {
                for (var j = 0; j < req.user.tokenSet[i].blogs.length; j++) {
                    if (req.user.tokenSet[i].blogs[j].url.toLowerCase() === blogUrl.toLowerCase()) {
                        return true;
                    }
                }
            }
        }

        if (req.isAuthenticated()) {
            if (isUserAllowed(req.blog.url)) {
                return next();
            }
            return res.send('You do not own this blog!');
        }
        res.render('index');
    });

    app.get('/blog/:blogUrl/posts', function(req, res) {
        PostSet.find({
            blogId: req.blog._id
        }).populate('posts').limit(100).exec(function(err, postSets) {
            if (err) {
                console.log(err);
            }
            if (postSets.length) {
                res.render('blog/posts', {
                    postSets: postSets
                });
            } else {
                res.send('This blog doesn\'t have any posts.');
            }
        });
    });

    app.get('/blog/:blogUrl/counters', function(req, res) {
        res.render('blog/counters', {
            blog: req.blog,
            baseUrl: config.get('web:baseUrl')
        });
    });

    app.get('/blog/:blogUrl/queues', function(req, res) {
        async.parallel([
            function(callback) {
                Queue.find({
                    blogId: req.blog._id
                }).exec(function(err, queues) {
                    if (err) {
                        callback(err);
                    }
                    callback(null, queues);
                });
            },
            function(callback) {
                PostSet.find({
                    blogId: req.blog._id
                }).sort('-_id').exec(function(err, postSets) {
                    if (err) {
                        callback(err);
                    }
                    callback(null, postSets);
                });
            }
        ],
        function(err, results) {
            if (err) {
                console.log(err);
            }
            res.render('blog/queues/index', {
                blog: req.blog,
                queues: results[0],
                postSets: results[1]
            });
        });
    });

    app.post('/blog/:blogUrl/queues', function(req, res) {
        if (req.body.interval) {
            var interval = ((req.body.interval > 0) && (req.body.interval <= 250)) ? req.body.interval : 250;
            var startHour = ((req.body.startHour > 0) && (req.body.startHour <= 24)) ? req.body.startHour : 0;
            var endHour = ((req.body.endHour > 0) && (req.body.endHour <= 24)) ? req.body.endHour : 24;
            var queue = new Queue({
                blogId: req.blog._id,
                interval: interval,
                startHour: startHour,
                endHour: endHour,
                backfill: false
            });
            queue.save();
            res.redirect('/blog/' + req.blog.url + '/queues');
        } else {
            res.send('You need to set an amount per 24 hours.');
        }
    });

    app.post('/blog/:blogUrl/queues/:queueId/delete', function(req, res) {
        Queue.findOne({
            _id: req.params.queueId
        }, function(err, queue) {
            if (err) {
                console.log(err);
            }
            queue.remove();
            res.redirect('/blog/' + req.blog.url + '/queues');
        });
    });

    app.post('/blog/:blogUrl/queues/shuffle', function(req, res) {
        async.waterfall([
            function(callback) {
                Post.count({
                    blogId: req.blog._id
                }).exec(function(err, postCount) {
                    if (err) {
                        callback(err);
                    }
                    callback(null, postCount);
                });
            },
            function(postCount, callback) {
                Post.find({
                    blogId: req.blog._id
                }, function(err, posts) {
                    if (err) {
                        callback(err);
                    }
                    async.each(posts, function(post, done) {
                        post.postOrder = Math.floor(Math.random() * (postCount - 1));
                        post.save(done);
                    }, callback(null, 'done'));
                });
            }
        ], function(err) {
            if (err) {
                console.log(err);
            }
            res.redirect('/blog/' + req.blog.url + '/queues');
        });
    });

    return app;
})();
