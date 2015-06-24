var express  = require('express'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    async = require('async'),
    _ = require('underscore'),
    moment = require('moment'),
    User  = require('../models/User'),
    Blog  = require('../models/Blog'),
    Post  = require('../models/Post'),
    Queue  = require('../models/Queue'),
    Stat  = require('../models/Stat'),
    TokenSet  = require('../models/TokenSet'),
    Notification  = require('../models/Notification'),
    PostSet = require('../models/PostSet');

module.exports = (function() {
    var app = express.Router();

    app.get('*', function(req, res, next){
        if (req.isAuthenticated()) { return next(); }

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
                    callback(null, userCount)
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
    });

    app.get('/blog/:blogUrl/*', function(req, res, next){
        function isUserAllowed (blogUrl){
            for (var i = 0; i < req.user.tokenSet.length;i++){
                for (var j = 0; j < req.user.tokenSet[i].blogs.length;j++){
                    if(req.user.tokenSet[i].blogs[j].url.toLowerCase() == blogUrl.toLowerCase()) return true;
                }
            }
        }
        if(isUserAllowed(req.params.blogUrl)){
            next();
        } else {
            res.send('You do not own this blog!');
        }
    });

    app.get('/blog/:blogUrl/stats', function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) console.log(err);
            if(blog){
                Stat.find({ blogId: blog.id } , '-_id -__v -blogId').sort('-date').limit(384).exec(function(err, stats){
                    if(err) console.log(err);
                    Stat.findOne({ blogId: blog.id } , '-_id -__v -blogId').sort('date').exec(function(err, firstStat){
                        if(err) console.log(err);
                        //- This is for the weekly gains and stuff
                        var current = stats[stats.length-1],
                            currentFollowers = current.followerCount,
                            daysBetweenFirstStatAndNow = Math.round(Math.abs((new Date(stats[0].date).getTime() - new Date(firstStat.date).getTime())/(24*60*60*1000))),
                            gainsPerDay = Math.floor((currentFollowers - firstStat.followerCount) / daysBetweenFirstStatAndNow),
                            lastUpdated = Math.floor((new Date().getTime() - new Date(stats[0].date).getTime())/ 60000);
                        res.render('blog/index', {
                            currentBlog: blog,
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
            } else {
                res.send('This blog doesn\'t exist.');
            }
        });
    });

    app.get('/blog/:blogUrl/posts', function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) console.log(err);
            if(blog){
                PostSet.find({blogId: blog.id}).populate('posts').limit(100).exec(function(err, postSets){
                    if(err) console.log(err);
                    if(postSets.length){
                        res.render('blog/posts', {
                            postSets: postSets
                        });
                    } else {
                        res.send('This blog doesn\'t have any posts.');
                    }
                });
            } else {
                res.send('This blog doesn\'t exist.');
            }
        });
    });

    app.get('/blog/:blogUrl/queues', function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) console.log(err);
            if(blog){
                async.parallel([
                    function(callback){
                        Queue.find({blogId: blog._id}).exec(function(err, queues){
                            if(err) callback(err);
                            callback(null, queues);
                        });
                    },
                    function(callback){
                        PostSet.find({blogId: blog.id}).sort('-_id').exec(function(err, postSets){
                            if(err) callback(err);
                            callback(null, postSets)
                        });
                    }
                ],
                function(err, results){
                    if(err) console.log(err);
                    res.render('blog/queues/index', {
                        blog:blog,
                        queues: results[0],
                        postSets: results[1]
                    });
                });
            } else {
                res.send('This blog doesn\'t exist.');
            }
        });
    });

    app.post('/blog/:blogUrl/queues', function(req, res){
        Blog.findOne({url: req.params.blogUrl}, function(err, blog){
            var queue = new Queue({
                blogId: blog.id,
                interval: req.body.interval,
                startHour: 0,
                endHour: 23,
                backfill: false
            });
            queue.save();
            res.redirect('/blog/' + req.params.blogUrl + '/queues');
        });
    });

    return app;
})();
