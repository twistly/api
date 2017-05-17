import {Router} from 'express';
import passport from 'passport';
import Agenda from 'agenda';
import agendash from 'agendash';
import async from 'async';

import {
    Post,
    User,
    TokenSet,
    Blog,
    Notification,
    Stat,
    Invite
} from '../models';

const agenda = new Agenda({
    db: {
        address: 'mongodb://127.0.0.1/agenda'
    }
});

const app = new Router();

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    async.parallel([
        callback => {
            Post.count({}, (err, postCount) => {
                if (err) {
                    callback(err);
                }
                callback(null, postCount);
            });
        },
        callback => {
            User.count({}, (err, userCount) => {
                if (err) {
                    callback(err);
                }
                callback(null, userCount);
            });
        }
    ],
    (err, results) => {
        if (err) {
            console.log(err);
        }
        res.render('comingSoon', {
            postsQueued: results[0],
            users: results[1]
        });
    });
}

app.get('*', (req, res, next) => {
    res.locals.title = 'Twistly';
    res.locals.numeral = require('numeral');

    return next();
});

app.get('/', ensureAuthenticated, (req, res) => {
    res.render('index');
});

app.get('/account', ensureAuthenticated, (req, res) => {
    res.render('account');
});

app.get('/user', ensureAuthenticated, (req, res) => {
    res.send(req.user);
});

app.get('/activity', ensureAuthenticated, (req, res) => {
    let skip = 0;
    if (req.query.page) {
        skip = req.query.page * 50;
    }
    const blogs = [];
    async.each(req.user.tokenSet, (tokenSet, callback) => {
        async.each(tokenSet.blogs, (blog, callback) => {
            blogs.push({
                blogId: blog.id
            });
            callback();
        });
        callback();
    });
    // This is to stop xo warnings until I fix this whole route
    res.send({skip});
    // PostSet.find({
    //     $or: blogs
    // }).skip(skip).limit(50).sort('-_id').lean().populate('blogId').exec((err, postSets) => {
    //     if (err) {
    //         res.send(err);
    //     }
    //     res.render('activity', {
    //         postSets
    //     });
    // });
});

app.get('/unlink/:tokenSetId', ensureAuthenticated, (req, res, next) => {
    User.findOne({
        _id: req.user.id,
        tokenSet: req.params.tokenSetId
    }).exec((err, user) => {
        if (err) {
            console.log(err);
        }
        if (user) {
            TokenSet.findOne({
                _id: req.params.tokenSetId
            }, (err, tokenSet) => {
                if (err) {
                    console.log(err);
                }
                if (tokenSet) {
                    async.eachSeries(tokenSet.blogs, (blog, callback) => {
                        Blog.findByIdAndRemove(blog, (err, doc) => {
                            if (err) {
                                console.log(err);
                            }
                            if (doc) {
                                callback();
                            }
                        });
                    }, () => {
                        tokenSet.remove(err => {
                            if (err) {
                                next(err);
                            }
                            res.redirect('/');
                        });
                    });
                }
            });
        } else {
            res.send(`You don't have that token, what do you think you're trying to do?`);
        }
    });
});

app.get('/auth/tumblr', ensureAuthenticated, passport.authenticate('tumblr', {
    callbackURL: '/auth/tumblr/callback'
}), (req, res) => {
    res.send('??');
});

app.get('/auth/tumblr/callback', ensureAuthenticated, (req, res, next) => {
    req._passport.instance.authenticate('tumblr', (err, user, info) => {
        if (err) {
            res.send(err);
        }
        const token = info.token;
        const tokenSecret = info.tokenSecret;
        const blogs = info.tumblr._json.response.user.blogs;
        User.findOne({
            _id: req.user.id
        }, (err, user) => {
            if (err) {
                console.log(err);
            }
            if (user) {
                Blog.findOne({
                    url: blogs[0].name
                }).exec((err, blog) => {
                    if (err) {
                        console.log(err);
                    }
                    if (blog) {
                        TokenSet.findOne({
                            blogs: blog.id
                        }, (err, tokenSet) => {
                            if (err) {
                                console.log(err);
                            }
                            if (tokenSet) {
                                tokenSet.token = token;
                                tokenSet.tokenSecret = tokenSecret;
                                tokenSet.enabled = true;
                                tokenSet.errorMessage = undefined;
                                User.findOne({
                                    _id: req.user.id,
                                    tokenSet: tokenSet.id
                                }, (err, tokenUser) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                    if (tokenUser) {
                                        tokenSet.save((err, tokenSet) => {
                                            if (err) {
                                                next(err);
                                            }
                                            if (tokenSet) {
                                                res.redirect('/');
                                            }
                                        });
                                    } else {
                                        user.tokenSet.push(tokenSet.id);
                                        user.save((err, user) => {
                                            if (err) {
                                                next(err);
                                            }
                                            if (user) {
                                                tokenSet.save((err, tokenSet) => {
                                                    if (err) {
                                                        next(err);
                                                    }
                                                    if (tokenSet) {
                                                        res.redirect('/');
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                res.send('Oops? That wasn\'t meant to happen at all!');
                            }
                        });
                    } else {
                        TokenSet.create({
                            token,
                            tokenSecret
                        }, (err, tokenSet) => {
                            if (err) {
                                console.log(err);
                            }
                            async.eachSeries(blogs, (blog, callback) => {
                                Notification.find({
                                    blogUrl: blog.name
                                }, (err, notifications) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                    const newBlog = new Blog({
                                        url: blog.name,
                                        postCount: blog.posts,
                                        isNsfw: blog.is_nsfw, // jshint ignore:line
                                        followerCount: blog.followers,
                                        primary: blog.primary,
                                        public: (blog.type === 'public'),
                                        notifications
                                    });
                                    newBlog.save((err, blog) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        if (blog) {
                                            const now = new Date();
                                            const stat = new Stat({
                                                blogId: blog._id,
                                                followerCount: blog.followerCount,
                                                postCount: blog.postCount,
                                                time: {
                                                    year: now.getFullYear(),
                                                    month: now.getMonth(),
                                                    date: now.getDate(),
                                                    hour: now.getHours()
                                                }
                                            });
                                            stat.save();
                                            tokenSet.blogs = tokenSet.blogs.toObject().concat([blog._id]);
                                            tokenSet.save((err, tokenSet) => {
                                                if (err) {
                                                    next(err);
                                                }
                                                if (tokenSet) {
                                                    callback();
                                                }
                                            });
                                        } else {
                                            console.log('NO BLOG???');
                                        }
                                    });
                                });
                            }, () => {
                                user.tokenSet.push(tokenSet.id);
                                user.save((err, user) => {
                                    if (err) {
                                        next(err);
                                    }
                                    if (user) {
                                        res.redirect('/');
                                    }
                                });
                            });
                        });
                    }
                });
            } else {
                res.redirect('/');
            }
        });
    })(req, res);
});

app.get('/genToken', ensureAuthenticated, (req, res, next) => {
    if (req.user.isAdmin) {
        Invite.create({
            token: (function() {
                // http://stackoverflow.com/questions/9719570/generate-random-password-string-with-requirements-in-javascript
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
                const stringLength = 16;
                let randomString = '';
                let charCount = 0;
                let numCount = 0;
                let rnum = 0;

                for (let i = 0; i < stringLength; i++) {
                    // If random bit is 0, there are less than 3 digits already saved, and there are not already 5 characters saved, generate a numeric value.
                    if (((Math.floor(Math.random() * 2) === 0) && numCount < 3) || charCount >= 5) {
                        rnum = Math.floor(Math.random() * 10);
                        randomString += rnum;
                        numCount += 1;
                    } else {
                        // If any of the above criteria fail, go ahead and generate an alpha character from the chars string
                        rnum = Math.floor(Math.random() * chars.length);
                        randomString += chars.substring(rnum, rnum + 1);
                        charCount += 1;
                    }
                }
                return randomString;
            })(),
            used: false
        }, (err, invite) => {
            if (err) {
                console.log(err);
            }
            res.send(invite);
        });
    } else {
        next();
    }
});

app.get('/unusedTokens', ensureAuthenticated, (req, res, next) => {
    if (req.user.isAdmin) {
        Invite.find({
            used: false
        }).select('token').exec((err, invites) => {
            if (err) {
                console.log(err);
            }
            res.send({
                count: invites.length,
                invites
            });
        });
    } else {
        next();
    }
});

app.get('/userCount', ensureAuthenticated, (req, res, next) => {
    if (req.user.isAdmin) {
        User.count((err, userCount) => {
            if (err) {
                console.log(err);
            }
            res.send({
                userCount
            });
        });
    } else {
        next();
    }
});

app.use('/agendash', agendash(agenda));

export default app;
