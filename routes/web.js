var express  = require('express'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    async = require('async'),
    _ = require('underscore'),
    User  = require('../models/User'),
    Blog  = require('../models/Blog'),
    TokenSet  = require('../models/TokenSet');

module.exports = (function() {
    var app = express.Router();

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/signin')
    }

    app.get('/', function(req, res){
        res.render('index', { user: req.user });
    });

    app.get('/', function(req, res){

    });

    app.get('/account', ensureAuthenticated, function(req, res){
        res.render('account', { user: req.user });
    });

    app.get('/unlink/:tokenSetId', ensureAuthenticated, function(req, res){
        TokenSet.findOne({_id: req.params.tokenSetId}, function(err, tokenSet){
            if(err) console.log(err);
            if(tokenSet) {
                async.eachSeries(tokenSet.blogs, function(blog, callback) {
                    Blog.findByIdAndRemove(blog, function(err, doc){
                        if (err) console.log(err);
                        callback();
                    });
                }, function () {
                    tokenSet.remove(function(err){
                        res.send('Blogs unlinked!');
                    });
                });
            }
        });
    });

    app.get('/auth/tumblr', passport.authenticate('tumblr'), function(req, res){
    });

    app.get('/auth/tumblr/callback', passport.authenticate('tumblr', { failureRedirect: '/signin' }), function(req, res) {
        res.redirect('/');
    });


    return app;
})();
