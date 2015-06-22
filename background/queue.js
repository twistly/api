var mongoose = require('mongoose'),
    tumblr = require('tumblr.js'),
    Queue = require('../models/Queue'),
    Post = require('../models/Post'),
    Blog = require('../models/Blog'),
    config = require('../config.js');

mongoose.connect('mongodb://localhost/xtend');

setInterval(function(){
    Queue.find(function(err, queues) {
        if (err) console.log(err);
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
                        if (err) console.log(err);
                        if (post){
                            Blog.findOne({_id: queue.blogId}, function(err, blog){
                                if (err) console.log(err);
                                if (blog && blog.enabled) {
                                    if (blog.token == '' || blog.tokenSecret == '' ) {
                                        blog.enabled = false;
                                        blog.errorMessage = 'Please reauthenticate with Tumblr.';
                                        blog.save();
                                    } else {
                                        var client = tumblr.createClient({
                                            consumer_key: config.tumblr.token,
                                            consumer_secret: config.tumblr.tokenSecret,
                                            token: blog.token,
                                            token_secret: blog.tokenSecret
                                        });
                                        var caption = post.clearCaption ? '' : post.caption;
                                        client.reblog(blog.url, {id: post.postId, reblog_key: post.reblogKey, caption: caption}, function(err, reblog){
                                            if (err) {
                                                console.log(err);
                                                blog.enabled = false;
                                                blog.errorMessage = err;
                                                blog.save();
                                            } else {
                                                console.log((new Date()) + ' ' + blog.url + ' reblogged');
                                                if (post.clearCaption) {
                                                    client.edit(blog.url, { id: reblog.id, caption: post.caption }, function (err, edit) {
                                                        if (err) console.log(err);
                                                        console.log((new Date()) + ' ' + blog.url + ' changed caption');
                                                    });
                                                }
                                                post.remove();
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
    });
}, 1000);
