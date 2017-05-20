import Joi from 'joi';

import async from 'async';
import {Router} from 'express';

import {
    Post,
    Queue
} from '../models';

import {apiLogger as log} from '../log';

const router = new Router();

router.get('/', (req, res) => {
    const blogId = req.blog._id;
    const queues = Queue.find({blogId}).exec();
    res.send({queues});
});

// @TODO: Replace this
router.post('/', (req, res, next) => {
    Joi.validate({
        interval: req.body.interval
    }, {
        interval: Joi.number()
    }, next);
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

router.delete('/:queueId', async (req, res) => {
    const queue = Queue.findOne({_id: req.params.queueId}).exec().catch(err => log.error(err));
    queue.remove();
    res.redirect('/blog/' + req.blog.url + '/queues');
});

router.post('/:queueId', (req, res) => {
    const postCount = Post.count({blogId: req.blog._id}).exec().catch(err => log.error(err));
    const posts = Post.find({blogId: req.blog._id}).exec().catch(err => log.error(err));
    async.each(posts, (post, done) => {
        post.postOrder = Math.floor(Math.random() * (postCount - 1));
        post.save(done);
    }).then(() => {
        res.redirect('/blog/' + req.blog.url + '/queues');
    });
});

export default router;
