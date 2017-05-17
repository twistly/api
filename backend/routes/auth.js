const express = require('express');
const passport = require('passport');

module.exports = (function() {
    const app = new express.Router();

    app.get('/signin', (req, res) => {
        res.render('signin');
    });

    app.get('/signup', (req, res) => {
        res.render('signup');
    });

    app.post('/signin', passport.authenticate('local-signin', {
        successRedirect: '/',
        failureRedirect: '/signin',
        failureFlash: false
    }));

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/signup',
        failureFlash: false
    }));

    app.get('/signout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    return app;
})();
