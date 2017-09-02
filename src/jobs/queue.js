import d from 'debug';
import Tumblr from 'tumblr.js';
import config from '../config';
import {User, Post, Queue, TumblrAccount} from '../models';

const debug = d('twistly:jobs:queue');
debug('loaded');

export default agenda => {
    agenda.define('check queue', async (job, done) => {
        const {queueId, userId} = job.attrs.data;
        debug(`Checking if queue ${queueId} is allowed to post`);

        const user = await User.findOne({_id: userId}).select('suspended').lean().exec().catch(err => {
            debug(err);
            debug('calling done');
            return done(err);
        });

        if (user.suspended) {
            return done(`Cannot check queue as user ${userId} is suspended`);
        }

        const queue = await Queue.findOne({_id: queueId}).select('startTime endTime enabled').lean().exec().catch(err => {
            debug(err);
            debug('calling done');
            return done(err);
        });

        const now = (new Date()).getTime();
        const midnight = (new Date()).setHours(0, 0, 0, 0);
        const startTime = midnight + queue.startTime;
        const endTime = midnight + queue.endTime;

        if (startTime >= now || endTime <= now) {
            return done(`Queue isn't set to run yet.`);
        }

        if (!queue.enabled) {
            return done('Cannot schedule queue process as queue is disabled');
        }

        const newJob = agenda.create('process queue', {userId: user._id, queueId: queue._id});
        newJob.unique({'data.userId': user._id, 'data.queueId': queue._id});
        newJob.schedule(new Date());
        newJob.save(err => {
            if (err) {
                debug(err);
                debug('calling done');
                return done(err);
            }
        });

        debug(`Scheduling queue [${queue._id}] to be processed`);
        return done();
    });

    agenda.define('process queue', async (job, done) => {
        const {userId, queueId} = job.attrs.data;
        debug(`Trying to process queue [%s] for user [%s]`, queueId, userId);
        const queue = await Queue.findOne({_id: queueId}).populate('blogs', '_id url').populate('posts').exec().catch(err => {
            debug(err);
            debug('calling done');
            return done(err);
        });

        debug('Queue returned %O', queue);

        if (queue.posts.length === 0) {
            return done(`Cannot process queue as it's empty`);
        }

        // First post
        const [post] = queue.posts;
        debug('Trying to process post [%s] to queue [%s]', post._id, queue._id);

        queue.blogs.forEach(async blog => {
            debug(`Processing blog [%s]`, blog._id);
            const {_id, token, secret} = await TumblrAccount.findOne({blogs: blog._id}).select('token secret').lean().exec().catch(err => {
                debug(err);
                debug('calling done');
                return done(err);
            });

            if (!token || !secret) {
                debug(`TumblrAccount [${_id}] is missing it's token or secret`);
                return done(`TumblrAccount [${_id}] is missing it's token or secret`);
            }

            const client = new Tumblr.Client({
                credentials: {
                    consumer_key: process.env.TUMBLR_TOKEN || config.get('tumblr.token'), // eslint-disable-line camelcase
                    consumer_secret: process.env.TUMBLR_TOKEN_SECRET || config.get('tumblr.tokenSecret'), // eslint-disable-line camelcase
                    token,
                    token_secret: secret // eslint-disable-line camelcase
                }
            });

            debug(`Successfully connected to Tumblr for blog [%s]`, blog._id);

            client.reblogPost(blog.url, {
                id: post.postId,
                reblog_key: post.reblogKey // eslint-disable-line camelcase
            }, async (err, resp) => {
                if (err) {
                    debug(err);
                    return done(err);
                }

                debug(`Tumblr returned %O`, resp);

                debug(`Successfully reblogged [%s] to Tumblr for blog [%s]`, post.postId, blog._id);

                try {
                    await Post.findOneAndRemove({_id: post._id}).lean().exec();
                    queue.posts = queue.posts.splice(queue.posts.findIndex(x => post._id === x._id), 1);
                    await queue.save();
                    debug('Finished processing queue [%s]', queue._id);
                } catch (err) {
                    debug(err);
                    return done(err);
                }
            });
        });

        return done();
    });
};
