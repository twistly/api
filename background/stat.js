const path = require('path');
const config = require('cz');
const mongoose = require('mongoose');
const tumblr = require('tumblr.js');
const Blog = require('../app/models/blog.js');
const Stat = require('../app/models/stat.js');
const TokenSet = require('../app/models/token-set.js');

config.load(path.normalize(path.join(__dirname, '/../config.json')));
config.args();
config.store('disk');

mongoose.connect('mongodb://' + config.joinGets(['db:host', 'db:port', 'db:collection'], [':', '/']));

setInterval(function() {
    TokenSet.find({}).populate('blogs').exec(function(err, tokenSets) {
        if (err) {
            console.log(err);
        }
        tokenSets.forEach(function(tokenSet) {
            var timeNow = new Date().getTime();
            if (timeNow >= (tokenSet.lastUpdatedStat.getTime() + 1800000)) {
                tokenSet.lastUpdatedStat = new Date(timeNow);
                tokenSet.save();
                var client = tumblr.createClient({
                    consumer_key: config.get('tumblr:token'), // eslint-disable-line camelcase
                    consumer_secret: config.get('tumblr:tokenSecret'), // eslint-disable-line camelcase
                    token: tokenSet.token, // eslint-disable-line camelcase
                    token_secret: tokenSet.tokenSecret // eslint-disable-line camelcase
                });
                client.userInfo(function (err, data) {
                    if (err) {
                        if (err.message === 'API error: 401 Not Authorized') {
                            console.log('URL changed or user removed our access to token.');
                            tokenSet.enabled = false;
                            tokenSet.errorMessage = 'Please reauthenticate with Tumblr.';
                            tokenSet.save();
                        } else {
                            console.log(err);
                        }
                    } else if (data) {
                        data.user.blogs.forEach(function(tumblrBlog) { // eslint-disable-line max-nested-callbacks
                            Blog.findOne({
                                url: tumblrBlog.name
                            }, function(err, blog) { // eslint-disable-line max-nested-callbacks
                                if (err) {
                                    console.log(err);
                                }
                                if (blog) {
                                    var stat = new Stat({
                                        blogId: blog.id,
                                        followerCount: tumblrBlog.followers,
                                        postCount: tumblrBlog.posts
                                    });
                                    stat.save();
                                    blog.followerCount = tumblrBlog.followers;
                                    blog.postCount = tumblrBlog.posts;
                                    blog.save();
                                    console.log('Done - ' + tumblrBlog.name + ' - ' + tumblrBlog.followers);
                                } else {
                                    console.log('blog not found? URL: ' + tumblrBlog.name);
                                }
                            });
                        });
                    }
                });
            }
        });
    });
}, 1000);
