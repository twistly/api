var bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    TumblrStrategy = require('passport-tumblr').Strategy,
    passport = require('passport'),
    async = require('async'),
    config = require('./config.js'),
    Blog  = require('./models/Blog'),
    User  = require('./models/User'),
    Plan  = require('./models/Plan'),
    TokenSet  = require('./models/TokenSet');

module.exports = (function() {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id).populate('tokenSet').populate('plan').exec(function (err, user) {
            async.forEach(user.tokenSet, function (tokenSet, callback) {
                tokenSet.populate({ path: 'blogs', limit: 100 }, function (err, result) {
                    callback();
                });
            }, function (err) {
                done(err, user);
            });
        });
    });

    passport.use('local-signin', new LocalStrategy(function(username, password, done) {
        User.findOne({ username: username }, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
            user.comparePassword(password, function(err, isMatch) {
                if (err) return done(err);
                if(isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Invalid password' });
                }
            });
        });
    }));

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {
        process.nextTick(function() {
            User.findOne({username: username}, function(err, user) {
                if (err) return done(err);
                if (user) {
                    return done(null, false, { message: 'That username is already taken.' });
                } else {
                    var user = new User({
                        username: username,
                        email: req.body.email,
                        password: password
                    });
                    user.save(function(err, user) {
                        if (err) throw err;
                        return done(null, user);
                    });
                }
            });
        });
    }));

    passport.use('tumblr', new TumblrStrategy({
        consumerKey: config.tumblr.token,
        consumerSecret: config.tumblr.tokenSecret,
        callbackURL: "http://192.168.1.158:3000/auth/tumblr/callback"
    },
    function(token, tokenSecret, profile, done) {
        var blogs = profile._json.response.user.blogs;
        User.findOne({}, function(err, user){
            if(err) console.log(err);
            if(user){
                Blog.findOne({url: blogs[0].name}).exec(function(err, blog){
                    if(err) console.log(err);
                    if(blog){
                        TokenSet.findOne({blogs: blog.id}, function(err, tokenSet){
                            if(err) console.log(err);
                            if(tokenSet){
                                tokenSet.token = token;
                                tokenSet.tokenSecret = tokenSecret;
                                tokenSet.save(function(err, tokenSet){
                                    return done(null, user);
                                });
                            } else {
                                res.send('Oops? That wasn\'t meant to happen at all!');
                            }
                        });
                    } else {
                        TokenSet.create({ token: token, tokenSecret: tokenSecret }, function (err, tokenSet) {
                            if(err) console.log(err);
                            async.eachSeries(blogs, function(blog, callback) {
                                var newBlog = new Blog({
                                    url: blog.name,
                                    postCount: blog.posts,
                                    isNsfw: blog.is_nsfw,
                                    followerCount: blog.followers,
                                    primary: blog.primary,
                                    public: (blog.type == 'public')
                                });
                                newBlog.save(function(err, blog) {
                                    if(err) console.log(err);
                                    if(blog){
                                        tokenSet.blogs = tokenSet.blogs.toObject().concat([blog._id]);
                                        tokenSet.save(function(err, tokenSet){
                                            callback();
                                        });
                                    } else {
                                        console.log('NO BLOG???');
                                    }
                                });
                            }, function () {
                                user.tokenSet.push(tokenSet.id);
                                user.save(function(err, user){
                                    return done(null, user);
                                });
                            });
                        });
                    }
                });
            } else {
                return done(null, false, { message: 'Can\'t find a user associated with that blog' });
            }
        });
    }));

    return passport;
})();
