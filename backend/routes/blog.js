import {Router} from 'express';
import async from 'async';

import {
    Post,
    Queue,
    Stat
} from '../models';

import {blogUrl} from '../middleware';

const app = new Router();

app.get('/blog/:blogUrl/stats', blogUrl, async (req, res) => {
    const stats = await Stat.find({
        blogId: req.blog._id
    }, '-_id -__v -blogId').sort('date').limit(384).exec();
    const firstStat = stats[stats.length - 1];
    const current = stats[0];
    const currentFollowers = current.followerCount;
    const daysBetweenFirstStatAndNow = Math.round(Math.abs((new Date(stats[0].date).getTime() - new Date(firstStat.date).getTime()) / (24 * 60 * 60 * 1000)));
    const gainsPerDay = Math.floor((currentFollowers - firstStat.followerCount) / daysBetweenFirstStatAndNow);
    const lastUpdated = Math.floor((new Date().getTime() - new Date(stats[0].date).getTime()) / 60000);
    res.render('blog/index', {
        currentBlog: req.blog,
        stats,
        statTable: {
            forecast: {
                week: currentFollowers + (gainsPerDay * 7),
                month: currentFollowers + (gainsPerDay * 30),
                year: currentFollowers + (gainsPerDay * 365)
            },
            lastUpdated: lastUpdated < 2 ? 'just now' : lastUpdated + ' minutes ago',
            currentFollowers,
            html: []
        }
    });
});

app.get('/blog/:blogUrl/*', (req, res, next) => {
    // @TODO: Change Schema to remove the need for this nested crap :(
    const isUserAllowed = blogUrl => {
        for (let i = 0; i < req.user.tokenSet.length; i++) {
            for (let j = 0; j < req.user.tokenSet[i].blogs.length; j++) {
                if (req.user.tokenSet[i].blogs[j].url.toLowerCase() === blogUrl.toLowerCase()) {
                    return true;
                }
            }
        }
    };

    if (req.isAuthenticated()) {
        if (isUserAllowed(req.blog.url)) {
            return next();
        }
        return res.send('You do not own this blog!');
    }
    res.render('index');
});

app.get('/blog/:blogUrl/posts', (req, res) => {
    // PostSet.find({
    //     blogId: req.blog._id
    // }).populate('posts').limit(100).exec((err, postSets) => {
    //     if (err) {
    //         console.log(err);
    //     }
    //     if (postSets.length >= 1) {
    //         res.render('blog/posts', {
    //             postSets
    //         });
    //     } else {
    //         res.send('This blog doesn\'t have any posts.');
    //     }
    // });
});

app.get('/blog/:blogUrl/counters', (req, res) => {
    res.render('blog/counters', {
        blog: req.blog,
        baseUrl: 'https://twistly.xyz/'
    });
});

app.get('/blog/:blogUrl/queues', (req, res) => {
    async.parallel([
        callback => {
            Queue.find({
                blogId: req.blog._id
            }).exec((err, queues) => {
                if (err) {
                    callback(err);
                }
                callback(null, queues);
            });
        },
        callback => {
            // PostSet.find({
            //     blogId: req.blog._id
            // }).sort('-_id').exec((err, postSets) => {
            //     if (err) {
            //         callback(err);
            //     }
            //     callback(null, postSets);
            // });
        }
    ], (err, results) => {
        if (err) {
            console.log(err);
        }
        res.render('blog/queues/index', {
            blog: req.blog,
            queues: results[0],
            postSets: results[1]
        });
    });
});

app.post('/blog/:blogUrl/queues', (req, res) => {
    if (req.body.interval) {
        const interval = ((req.body.interval > 0) && (req.body.interval <= 250)) ? req.body.interval : 250;
        const startHour = ((req.body.startHour > 0) && (req.body.startHour <= 24)) ? req.body.startHour : 0;
        const endHour = ((req.body.endHour > 0) && (req.body.endHour <= 24)) ? req.body.endHour : 24;
        const queue = new Queue({
            blogId: req.blog._id,
            interval,
            startHour,
            endHour,
            backfill: false
        });
        queue.save();
        res.redirect('/blog/' + req.blog.url + '/queues');
    } else {
        res.send('You need to set an amount per 24 hours.');
    }
});

app.post('/blog/:blogUrl/queues/:queueId/delete', (req, res) => {
    Queue.findOne({
        _id: req.params.queueId
    }, (err, queue) => {
        if (err) {
            console.log(err);
        }
        queue.remove();
        res.redirect('/blog/' + req.blog.url + '/queues');
    });
});

app.post('/blog/:blogUrl/queues/shuffle', (req, res) => {
    async.waterfall([
        function(callback) {
            Post.count({
                blogId: req.blog._id
            }).exec((err, postCount) => {
                if (err) {
                    callback(err);
                }
                callback(null, postCount);
            });
        },
        function(postCount, callback) {
            Post.find({
                blogId: req.blog._id
            }, (err, posts) => {
                if (err) {
                    callback(err);
                }
                async.each(posts, (post, done) => {
                    post.postOrder = Math.floor(Math.random() * (postCount - 1));
                    post.save(done);
                }, callback(null, 'done'));
            });
        }
    ], err => {
        if (err) {
            console.log(err);
        }
        res.redirect('/blog/' + req.blog.url + '/queues');
    });
});

export default app;
