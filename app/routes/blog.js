var express  = require('express'),
    async = require('async'),
    config = require('cz'),
    Blog  = require('../models/Blog.js'),
    Queue  = require('../models/Queue.js'),
    Stat  = require('../models/Stat.js'),
    PostSet = require('../models/PostSet.js');

config.load(path.normalize(__dirname + '/../../config.json'));
config.args();
config.store('disk');

module.exports = (function() {
    var app = express.Router();

    function ensureAuthenticated(req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        } else {
            res.render('index');
        }
    }

    app.get('/blog/:blogUrl/stats/public', function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) { console.log(err); }
            if(blog){
                Stat.find({ blogId: blog.id } , '-_id -__v -blogId').sort('-date').limit(384).exec(function(err, stats){
                    if(err) { console.log(err); }
                    Stat.findOne({ blogId: blog.id } , '-_id -__v -blogId').sort('date').exec(function(err, firstStat){
                        if(err) { console.log(err); }
                        //- This is for the weekly gains and stuff
                        var current = stats[0],
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

    app.get('/blog/:blogUrl/*', ensureAuthenticated, function(req, res, next){
        function isUserAllowed (blogUrl){
            for (var i = 0; i < req.user.tokenSet.length;i++){
                for (var j = 0; j < req.user.tokenSet[i].blogs.length;j++){
                    if(req.user.tokenSet[i].blogs[j].url.toLowerCase() === blogUrl.toLowerCase()) { return true; }
                }
            }
        }
        if(isUserAllowed(req.params.blogUrl)){
            next();
        } else {
            res.send('You do not own this blog!');
        }
    });

    app.get('/blog/:blogUrl/stats', ensureAuthenticated, function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) { console.log(err); }
            if(blog){
                Stat.find({ blogId: blog.id } , '-_id -__v -blogId').sort('-date').limit(384).exec(function(err, stats){
                    if(err) { console.log(err); }
                    if(stats.length){
                        Stat.findOne({ blogId: blog.id } , '-_id -__v -blogId').sort('date').exec(function(err, firstStat){
                            if(err) { console.log(err); }
                            //- This is for the weekly gains and stuff
                            var current = stats[0],
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
                    } else {
                        res.send('This blog doesn\'t have any stats');
                    }
                });
            } else {
                res.send('This blog doesn\'t exist.');
            }
        });
    });

    app.get('/blog/:blogUrl/posts', ensureAuthenticated, function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) { console.log(err); }
            if(blog){
                PostSet.find({blogId: blog.id}).populate('posts').limit(100).exec(function(err, postSets){
                    if(err) { console.log(err); }
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

    app.get('/blog/:blogUrl/counters', ensureAuthenticated, function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) { console.log(err); }
            if(blog){
                res.render('blog/counters', {
                    blog: blog,
                    baseUrl: config.get('web:baseUrl')
                });
            } else {
                res.send('This blog doesn\'t exist.');
            }
        });
    });

    app.get('/blog/:blogUrl/queues', ensureAuthenticated, function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) { console.log(err); }
            if(blog){
                async.parallel([
                    function(callback){
                        Queue.find({blogId: blog._id}).exec(function(err, queues){
                            if(err) { callback(err); }
                            callback(null, queues);
                        });
                    },
                    function(callback){
                        PostSet.find({blogId: blog.id}).sort('-_id').exec(function(err, postSets){
                            if(err) { callback(err); }
                            callback(null, postSets);
                        });
                    }
                ],
                function(err, results){
                    if(err) { console.log(err); }
                    res.render('blog/queues/index', {
                        blog: blog,
                        queues: results[0],
                        postSets: results[1]
                    });
                });
            } else {
                res.send('This blog doesn\'t exist.');
            }
        });
    });

    app.post('/blog/:blogUrl/queues', ensureAuthenticated, function(req, res){
        Blog.findOne({url: req.params.blogUrl}, function(err, blog){
            if(req.body.interval) {
                var interval = ((req.body.interval > 0) && (req.body.interval <= 250)) ? req.body.interval : 250;
                var startHour = ((req.body.startHour > 0) && (req.body.startHour <= 24)) ? req.body.startHour : 0;
                var endHour = ((req.body.endHour > 0) && (req.body.endHour <= 24)) ? req.body.endHour : 24;
                var queue = new Queue({
                    blogId: blog.id,
                    interval: interval,
                    startHour: startHour,
                    endHour: endHour,
                    backfill: false
                });
                queue.save();
                res.redirect('/blog/' + req.params.blogUrl + '/queues');
            } else {
                res.send('You need to set an amount per 24 hours.');
            }
        });
    });

    app.post('/blog/:blogUrl/queues/:queueId/delete', ensureAuthenticated, function(req, res){
        Queue.findOne({_id: req.params.queueId}, function(err, queue){
            if(err) { console.log(err); }
            queue.remove();
            res.redirect('/blog/' + req.params.blogUrl + '/queues');
        });
    });

    return app;
})();
