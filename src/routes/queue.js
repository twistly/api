import Joi from 'joi';
import HTTPError from 'http-errors';
import d from 'debug';
import {Types} from 'mongoose';
import {Router} from 'express';
import {Blog, Post, Queue} from '../models';
import {isAuthenticated, resolveBlogUrl} from '../middleware';
import {flatten, createQueueJob} from '../utils';

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const debug = d('twistly:routes:queue');
const router = new Router();

router.use(isAuthenticated);

router.get('/', async (req, res, next) => {
    const blogs = flatten(req.user.tumblr.map(tumblr => tumblr.blogs));
    const queues = await Queue.find({
        blogs: {
            $in: blogs
        }
    }).populate('blogId', '_id url').exec().catch(next);

    if (queues.length >= 1) {
        return res.send({queues});
    }
    return res.sendStatus(204);
});

router.get('/:blogUrl', resolveBlogUrl, async (req, res, next) => {
    const blogId = req.blog._id;
    const queues = await Queue.find({blogId}).exec().catch(next);
    res.send({queues});
});

router.post('/', async (req, res, next) => {
    const isUserAllowed = blog => req.user.tumblr.filter(tumblr => tumblr.blogs.filter(_blog => _blog === blog._id));
    const {name, blogs, interval, startTime, endTime} = req.body;

    Joi.validate({name, blogs, interval, startTime, endTime}, {
        name: Joi.string().min(1).max(100).required(),
        blogs: Joi.array().items(Joi.string().required()).min(1).max(50).required(),
        interval: Joi.number().min(1).max(250).required(),
        startTime: Joi.number().min(0).max(ONE_DAY).required(),
        endTime: Joi.number().min(0).max(ONE_DAY).required()
    }, async (error, values) => {
        if (error) {
            return next(error);
        }

        const {name, blogs, interval, startTime, endTime} = values;

        // If we get passed a bunch of urls instead of ids convert them
        const mappedBlogs = await Promise.all(blogs.map(blog => {
            return new Promise(async resolve => {
                if (!Types.ObjectId.isValid(blog)) {
                    const url = blog;
                    const {_id} = await Blog.findOne({url}).select('_id').lean().exec();
                    resolve(_id || null);
                }
                resolve(blog);
            });
        }));

        // Removes all blogs not found on current user's req.user object
        mappedBlogs.filter(blog => isUserAllowed(blog));

        const queue = new Queue({
            owner: req.user._id,
            name,
            blogs: mappedBlogs,
            interval,
            startTime,
            endTime
        });
        queue.save(error => {
            if (error) {
                debug('%O', error);
                return next(new HTTPError.InternalServerError(`Queue could not be saved.`));
            }

            debug('Trying to create a job for %O', queue);
            createQueueJob({queueId: queue._id, userId: queue.owner._id, interval: queue.interval}).then(job => {
                debug(`Job ${job._id} saved successfully`);
            });

            return res.status(201).send({queue});
        });
    });
});

router.post('/:queueId', async (req, res, next) => {
    if (!req.query.randomise) {
        next(new HTTPError.BadRequest(`You need ?randomise in your query for this endpoint to work.`));
    }

    // Move this to Agenda
    const postCount = await Post.count({blogId: req.blog._id}).exec().catch(next);
    const posts = await Post.find({blogId: req.blog._id}).exec().catch(next);
    posts.forEach(async post => {
        post.postOrder = Math.floor(Math.random() * (postCount - 1));
        await post.save();
    }).then(() => {
        res.sendStatus(200);
    });
});

router.delete('/:queueId', async (req, res, next) => {
    const queue = await Queue.findOne({_id: req.params.queueId}).exec().catch(next);
    queue.remove(error => {
        if (error) {
            return res.send(new HTTPError.InternalServerError(`Queue could not be deleted.`));
        }
        return res.sendStatus(202);
    });
});

export default router;
