var mongoose = require('mongoose'),
    tumblr = require('tumblr.js'),
    Queue = require('../app/models/Queue.js'),
    Post = require('../app/models/Post.js'),
    Blog = require('../app/models/Blog.js'),
    TokenSet = require('../app/models/TokenSet.js'),
    path = require('path'),
    config = require('cz');

config.load(path.normalize(__dirname + '/../config.json'));
config.args();
config.store('disk');

mongoose.connect('mongodb://' + config.joinGets(['db:host', 'db:port', 'db:collection'], [':', '/']));

setInterval(function(){
    Queue.find(function(err, queues) {
        if (err) { console.log(err); }
        queues.forEach(function(queue){
            var now = new Date();
            var timeNow = now.getTime();
            var hourNow = now.getHours();
            if ((hourNow >= queue.startHour) && (hourNow <= queue.endHour)) {
                var lastRun = queue.lastRun.getTime();
                var nextRun = lastRun + ((((queue.endHour - queue.startHour) * 60 * 60) / queue.interval) * 1000);
                if (nextRun <= timeNow) {
                    if (queue.backfill) {
                        queue.lastRun = nextRun;
                    } else {
                        queue.lastRun = timeNow;
                    }
                    queue.save();
                    Post.findOne({blogId: queue.blogId}, function(err, post){
                        if(err) { console.log(err); }
                        if (post){
                            TokenSet.findOne({blogs: queue.blogId}, function(err, tokenSet){
                                if(err) { console.log(err); }
                                if (tokenSet && tokenSet.enabled) {
                                    if (tokenSet.token === '' || tokenSet.tokenSecret === '' ) {
                                        tokenSet.enabled = false;
                                        tokenSet.errorMessage = 'Please reauthenticate with Tumblr.';
                                        tokenSet.save();
                                    } else {
                                        var client = tumblr.createClient({
                                            consumer_key: config.tumblr.token, // jshint ignore:line
                                            consumer_secret: config.tumblr.tokenSecret, // jshint ignore:line
                                            token: tokenSet.token,
                                            token_secret: tokenSet.tokenSecret // jshint ignore:line
                                        });
                                        // var caption = post.clearCaption ? '' : post.caption;
                                        Blog.findOne({_id: queue.blogId}, function(err, blog){
                                            if(err) { console.log(err); }
                                            if(blog){
                                                console.log('Posting to ' + blog.url);
                                                // Add caption: caption back into reblog and edit
                                                client.reblog(blog.url, {
                                                    id: post.postId,
                                                    reblog_key: post.reblogKey // jshint ignore:line
                                                }, function (err) {
                                                    if(err) {
                                                        if(err.message === 'API error: 400 Bad Request') {
                                                            console.log('Post was probably deleted, removing from db.');
                                                            post.remove();
                                                            queue.lastRun = lastRun;
                                                            queue.save();
                                                        } else if(err.message === 'API error: 403 Forbidden'){
                                                            console.log('Post seems to be from a user that\'s blocked them? Removing from db.');
                                                            post.remove();
                                                            queue.lastRun = lastRun;
                                                            queue.save();
                                                        } else if(err.code !== 'ETIMEDOUT'){
                                                            console.dir(post);
                                                            console.dir(err);
                                                            tokenSet.enabled = false;
                                                            tokenSet.errorMessage = err;
                                                            tokenSet.save();
                                                        } else {
                                                            console.log('Tumblr timeout?' + err);
                                                        }
                                                    } else {
                                                        console.log((new Date()) + ' ' + blog.url + ' reblogged');
                                                        // if (post.clearCaption) {
                                                        //     client.edit(blog.url, { id: data.id, caption: post.caption }, function (err, edit) {
                                                        //         if(err) { console.log(err); }
                                                        //         console.log((new Date()) + ' ' + blog.url + ' changed caption');
                                                        //     });
                                                        // }
                                                        blog.postsInQueue--;
                                                        blog.save();
                                                        post.remove();
                                                    }
                                                });
                                            } else {
                                                console.log('Didn\'t find that blog?' + queue.blogId);
                                            }
                                        });
                                    }
                                } else {
                                    Blog.findOne({_id: queue.blogId}, function(err, blog){
                                        if(err) { console.log(err); }
                                        if(blog){
                                            console.log('Counldn\'t find a token set for ' + blog.name);
                                        } else {
                                            console.log('Didn\'t find that blog?' + queue.blogId);
                                        }
                                    });
                                }
                            });
                        } else { // jshint ignore:line
                            // console.log('They have no posts');
                        }
                    });
                }
            }
        });
    });
}, 1000);
