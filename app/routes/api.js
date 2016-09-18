const path = require('path');
const express = require('express');
const numeral = require('numeral');
const config = require('cz');
const _package = require('../../package.json');
const Blog = require('../models/blog.js');

config.load(path.normalize(path.join(__dirname, '/../../config.json')));
config.args();
config.store('disk');

module.exports = (function() {
    var app = new express.Router();

    app.get('/', function(req, res) {
        res.send('Welcome to the Twistly API. For documentation please see the <a href="https://github.com/omgimalexis/twistly">Github</a> repo.');
    });

    app.get('/version', function(req, res) {
        res.send({
            name: _package.name,
            version: _package.version,
            commit: _package.commit
        });
    });

    app.get('/blog/counter/followers/:blogUrl', function(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        var linkClass = req.query.class || '';
        var linkString = req.query.name ? req.query.name : 'followers';
        var fromTop = req.query.fromTop ? req.query.fromTop + (req.query.fromTop.slice(-2) === 'px' ? '' : 'px') : '26px';
        var fromRight = req.query.fromRight ? req.query.fromRight + (req.query.fromRight.slice(-2) === 'px' ? '' : 'px') : '4px';
        var goal = req.query.goal || 0;
        var goalString = req.query.goalName ? req.query.goalName : 'days till ' + (goal > 999 ? parseFloat((goal / 1000).toFixed(1)) + 'k' : goal);
        var gainsPerMonth = req.query.gainsPerMonth || 0;
        var gainsPerDay = gainsPerMonth ? (gainsPerMonth / 30) : req.query.gainsPerDay;
        var blogUrl = req.params.blogUrl;
        Blog.findOne({
            url: blogUrl
        }, function(err, blog) {
            if (err) {
                console.log(err);
            }
            var followers = numeral(blog.followerCount).format('0,0');
            if (req.query.format === 'json') {
                res.send(followers);
            } else {
                res.setHeader('content-type', 'application/javascript');
                if (goal) {
                    var daysToGoal = Math.floor((goal - blog.followerCount) / gainsPerDay);
                    daysToGoal = daysToGoal < 0 ? 0 : daysToGoal;
                    res.send('document.write("<a style=\\"position: fixed; top: ' + fromTop + '; right: ' + fromRight + '\\" class=\\"' + linkClass + '\\" href=\\"' + config.get('web:baseUrl') + '/blog/' + blogUrl + '/stats/public\\">' + daysToGoal + ' ' + goalString + '</a>")');
                }
                if (!goal && req.query.format === 'simple') {
                    res.send('document.write("<a class=\\"' + linkClass + '\\" href=\\"' + config.get('web:baseUrl') + '/blog/' + blogUrl + '/stats/public\\">' + followers + ' ' + linkString + '</a>")');
                } else {
                    res.send('document.write("<a style=\\"position: fixed; top: ' + fromTop + '; right: ' + fromRight + '\\" class=\\"' + linkClass + '\\" href=\\"' + config.get('web:baseUrl') + '/blog/' + blogUrl + '/stats/public\\">' + followers + ' ' + linkString + '</a>")');
                }
            }
        });
    });

    return app;
})();
