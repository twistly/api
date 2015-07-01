var mongoose = require('mongoose'),
    tumblr = require('tumblr.js'),
    Blog = require('../models/Blog'),
    Stat = require('../models/Stat'),
    TokenSet = require('../models/TokenSet'),
    config = require('../config/config.js');

mongoose.connect(config.db.uri);

setInterval(function(){
    TokenSet.find({}).populate('blogs').exec(function(err, tokenSets) {
        if(err) console.log(err);
        tokenSets.forEach(function(tokenSet){
            var timeNow = new Date().getTime();
            if (timeNow >= (tokenSet.lastUpdatedStat.getTime() + 1800000)) {
                tokenSet.lastUpdatedStat = new Date(timeNow);
                tokenSet.save();
                var tumblr = require('tumblr.js');
                var client = tumblr.createClient({
                    consumer_key: config.tumblr.token,
                    consumer_secret: config.tumblr.tokenSecret,
                    token: tokenSet.token,
                    token_secret: tokenSet.tokenSecret
                });
                client.userInfo(function (err, data) {
                    if(err) {
                        if(err.message == 'API error: 401 Not Authorized') {
                            console.log('URL changed or user removed our access to token.');
                            tokenSet.enabled = false;
                            tokenSet.errorMessage = 'Please reauthenticate with Tumblr.';
                            tokenSet.save();
                        } else {
                            console.log(err);
                        }
                    } else if(data){
                        data.user.blogs.forEach(function (tumblrBlog) {
                            Blog.findOne({ url: tumblrBlog.name }, function(err, blog){
                                if(err) console.log(err);
                                if(blog){
                                    var now = new Date();
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
