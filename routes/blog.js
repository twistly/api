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
    Notification  = require('../models/Notification');

module.exports = (function() {
    var app = express.Router();

    app.get('*', function(req, res, next){
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/signin')
    });

    app.get('/blog/:blogUrl', function(req, res){
        Blog.findOne({url: req.params.blogUrl}).exec(function(err, blog){
            if(err) console.log(err);
            if(blog){
                Stat.find({ blogId: blog.id }).sort('-_id').limit(168).exec(function(err, stats){
                    if(err) console.log(err);
                    res.render('blog/index', {
                        blog: blog,
                        stats: stats
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
                Post.find({blogId: blog.id}).limit(100).exec(function(err, posts){
                    if(err) console.log(err);
                    if(posts.length){
                        res.render('blog/posts', {
                            posts: posts
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
                Queue.find({blogId: blog._id}).exec(function(err, queues){
                    if(err) console.log(err);
                    if(queues){
                        res.render('blog/queues/index', {
                            blog:blog,
                            queues: queues
                        });
                    } else {
                        res.send('This blog doesn\'t have any queues.');
                    }
                });
            } else {
                res.send('This blog doesn\'t exist.');
            }
        });
    });

    app.get('/blog/:blogUrl/followers', function(req, res){

    });

    app.get('/blog/:blogUrl/queues/new', function(req, res){
        res.render('blog/queues/new');
    });

    app.post('/blog/:blogUrl/queues/new', function(req, res){
        res.redirect('/blog/' + req.params.blogUrl + '/queues');
    });

    return app;
})();
