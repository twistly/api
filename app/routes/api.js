var express  = require('express'),
    numeral = require('numeral'),
    config = require('cz'),
    path = require('path'),
    Blog  = require('../models/Blog.js');

config.load(path.normalize(__dirname + '/../../config.json'));
config.args();
config.store('disk');

module.exports = (function() {
    var app = express.Router();

    app.get('/', function(req, res){
        res.send('Welcome to the Xtend API. For documentation please see the <a href="https://github.com/omgimalexis/xtend">Github</a> repo.');
    });

    app.get('/check', function(req, res){
        res.send({
            ok: 'okay'
        });
    });

    app.get('/blog/counter/followers/:blogUrl', function(req, res){
        var linkClass = req.query.class || '';
        var linkString = req.query.name ? req.query.name : 'followers';
        var fromTop = req.query.fromTop ? req.query.fromTop + (req.query.fromRight.slice(-2) === 'px' ? '' : 'px') : '26px';
        var fromRight = req.query.fromRight ? req.query.fromRight + (req.query.fromRight.slice(-2) === 'px' ? '' : 'px') : '4px';
        var blogUrl = req.params.blogUrl;
        Blog.findOne({
            url: blogUrl
        }, function(err, blog){
            var followers = numeral(blog.followerCount).format('0,0');
            res.setHeader('content-type', 'application/javascript');
            if(req.query.format === 'simple'){
                res.send('document.write("<a class=\\"' + linkClass + '\\" href=\\"' + config.get('web:baseUrl') + '/blog/' + blogUrl + '/stats/public\\">' + followers + ' ' + linkString + '</a>")');
            } else {
                res.send('document.write("<a style=\\"position: fixed; top: ' + fromTop + '; right: ' + fromRight + '\\" class=\\"' + linkClass + '\\" href=\\"' + config.get('web:baseUrl') + '/blog/' + blogUrl + '/stats/public\\">' + followers + ' ' + linkString + '</a>")');
            }
        });
    });
    return app;
})();
