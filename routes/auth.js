var express  = require('express'),
    bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    User  = require('../models/User');

module.exports = (function() {
    var app = express.Router();

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/signin')
    }

    app.get('/signin', function(req, res){
        res.render('signin')
    });

    app.get('/signup', function(req, res){
        res.render('signup');
    });

    app.post('/signin', passport.authenticate('local-signin', {
        successRedirect : '/account', // redirect to the secure profile section
        failureRedirect : '/signin', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/account',
        failureRedirect : '/signup',
        failureFlash : true // allow flash messages
    }));

    app.get('/signout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    return app;
 })();
