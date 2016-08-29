const path = require('path');
const mongoose = require('mongoose');
const tumblr = require('tumblr.js');
const config = require('cz');
const Queue = require('../app/models/Queue.js');
const Post = require('../app/models/Post.js');
const Blog = require('../app/models/Blog.js');
const TokenSet = require('../app/models/TokenSet.js');

config.load(path.normalize(path.join(__dirname, '/../config.json')));
config.args();
config.store('disk');

mongoose.connect('mongodb://' + config.joinGets(['db:host', 'db:port', 'db:collection'], [':', '/']));

setInterval(function() {
    var now = new Date();
    var timeNow = now.getTime();
    Queue.find({
        $where: function() {
            var now = new Date();
            var hourNow = now.getHours();
            if ((this.startHour <= hourNow && this.endHour >= hourNow) && new Date((this.lastRun.getTime() + ((((this.endHour - this.startHour) * 60 * 60) / this.interval) * 1000))) <= now) {
                return true;
            }
            return false;
        }
    }, function(err, queues) {
        if (err) {
            console.log(err);
        }
        queues.forEach(function(queue) {
            var lastRun = queue.lastRun.getTime();
            var nextRun = lastRun + ((((queue.endHour - queue.startHour) * 60 * 60) / queue.interval) * 1000);
            if (queue.backfill) {
                queue.lastRun = nextRun;
            } else {
                queue.lastRun = timeNow;
            }
            queue.save();
            Post.findOne({
                blogId: queue.blogId
            }).sort('postOrder').exec(function(err, post) {
                if (err) {
                    console.log(err);
                }
                if (post) {
                    TokenSet.findOne({
                        blogs: queue.blogId
                    }, function(err, tokenSet) {
                        if (err) {
                            console.log(err);
                        }
                        if (tokenSet && tokenSet.enabled) {
                            if (tokenSet.token === '' || tokenSet.tokenSecret === '') {
                                tokenSet.enabled = false;
                                tokenSet.errorMessage = 'Please reauthenticate with Tumblr.';
                                tokenSet.save();
                            } else {
                                var client = tumblr.createClient({
                                    consumer_key: config.get('tumblr:token'), // eslint-disable-line camelcase
                                    consumer_secret: config.get('tumblr:tokenSecret'), // eslint-disable-line camelcase
                                    token: tokenSet.token, // eslint-disable-line camelcase
                                    token_secret: tokenSet.tokenSecret // eslint-disable-line camelcase
                                });
                                Blog.findOne({
                                    _id: queue.blogId
                                }, function(err, blog) { // eslint-disable-line max-nested-callbacks
                                    if (err) {
                                        console.log(err);
                                    }
                                    if (blog) {
                                        console.log((new Date()) + ' Posting ' + post._id + ' to ' + blog.url);
                                        client.reblog(blog.url, {
                                            id: post.postId,
                                            reblog_key: post.reblogKey // eslint-disable-line camelcase
                                        }, function(err) { // eslint-disable-line max-nested-callbacks
                                            if (err) {
                                                if (err.message === 'API error: 400 Bad Request' || err.message === 'API error: 404 Not Found') {
                                                    console.log('Post was probably deleted, removing from db.');
                                                    post.remove();
                                                    queue.lastRun = lastRun;
                                                    queue.save();
                                                } else if (err.message === 'API error: 403 Forbidden') {
                                                    console.log('Post seems to be from a user that\'s blocked them? Removing from db.');
                                                    post.remove();
                                                    queue.lastRun = lastRun;
                                                    queue.save();
                                                } else if (err.message === 'API error: 401 Unauthorized') {
                                                    console.log('Auth has been revoked. Disabling all blogs linked to this tokenSet.');
                                                    tokenSet.enabled = false;
                                                    tokenSet.errorMessage = 'Please reauthenticate with Tumblr.';
                                                    tokenSet.save();
                                                    queue.lastRun = lastRun;
                                                    queue.save();
                                                } else if (err.code !== 'ETIMEDOUT') { // eslint-disable-line no-negated-condition
                                                    console.dir(err);
                                                    tokenSet.enabled = false;
                                                    tokenSet.errorMessage = err;
                                                    tokenSet.save();
                                                } else {
                                                    console.log('Tumblr timeout?' + err);
                                                }
                                            } else {
                                                console.log((new Date()) + ' Reblogged ' + post._id + ' to ' + blog.url);
                                                blog.postsInQueue--;
                                                blog.save();
                                                console.log((new Date()) + ' Deleted ' + post._id + ' as it was reblogged to ' + blog.url);
                                                post.remove();
                                            }
                                        });
                                    } else {
                                        console.log('Didn\'t find that blog?' + queue.blogId);
                                    }
                                });
                            }
                        } else {
                            Blog.findOne({
                                _id: queue.blogId
                            }, function(err, blog) { // eslint-disable-line max-nested-callbacks
                                if (err) {
                                    console.log(err);
                                }
                                if (blog) {
                                    if (tokenSet.enabled) {
                                        console.log('Couldn\'t find a token set for ' + blog.url);
                                    } else {
                                        console.log('Please reauth ' + blog.url);
                                    }
                                } else {
                                    console.log('Didn\'t find that blog? ' + queue.blogId);
                                }
                            });
                        }
                    });
                }
            });
        });
    });
}, 5000);
