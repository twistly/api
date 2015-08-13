var express  = require('express'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    async = require('async'),
    _ = require('underscore'),
    numeral = require('numeral'),
    User  = require('../models/User'),
    Blog  = require('../models/Blog'),
    Post  = require('../models/Post'),
    Queue  = require('../models/Queue'),
    TokenSet  = require('../models/TokenSet'),
    Notification = require('../models/Notification'),
    Stat = require('../models/Stat');

module.exports = (function() {
    var app = express.Router();

    app.get('/', function(req, res){
        res.send('Welcome to the Xtend API.');
    });

    app.get('/check', function(req, res){
        res.send({
            ok: 'okay'
        });
    });

    app.get('/blog/counter/followers/:blogUrl', function(req, res){
        var linkClass = req.query.class || '';
        var linkString = req.query.name ? req.query.name : 'followers';
        var fromTop = req.query.fromTop ? req.query.fromTop + 'px' : '26px';
        var fromRight = req.query.fromRight ? req.query.fromRight + 'px' : '4px';
        var blogUrl = req.params.blogUrl;
        Blog.findOne({url: blogUrl}, function(err, blog){
            var followers = numeral(blog.followerCount).format('0,0');
            res.setHeader('content-type', 'application/javascript');
            res.send('document.write("<a style=\\"position: fixed; top: ' + fromTop + '; right: ' + fromRight + '\\" class=\\"' + linkClass + '\\" href=\\"http://xtend.wvvw.me/blog/' + blogUrl + '/stats/public\\">' + followers + ' ' + linkString + '</a>")');
        });
    });
    return app;
})();
