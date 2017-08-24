import d from 'debug';
import tumblr from 'tumblr.js';
import config from '../config';
import {User, Post, Queue, TumblrAccount} from '../models';

const debug = d('twistly:jobs:queue');
debug('loaded');

export default agenda => {
    agenda.define('check queue', async (job, done) => {
        const {queueId, userId} = job.attrs.data;
        debug(`Checking if queue ${queueId} is allowed to post`);

        const user = await User.findOne({_id: userId}).select('suspended').lean().exec().catch(done);
        if (user.suspended) {
            return done(`Cannot check queue as user ${userId} is suspended`);
        }

        const queue = await Queue.findOne({_id: queueId}).select('startTime endTime enabled').lean().exec().catch(done);

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

        agenda.now('process queue', {
            queueId: queue._id,
            userId: user._id
        });

        return done();
    });

    agenda.define('process queue', async (job, done) => {
        const {queueId, userId} = job.attrs.data;
        debug(`Trying to process queue ${queueId} for ${userId}`);
        const queue = await Queue.findOne({_id: queueId}).populate('blogs', '_id url').lean().exec().catch(done);

        // First post
        const [post] = queue.posts;

        queue.blogs.forEach(async blog => {
            const {token, tokenSecret} = await TumblrAccount.findOne({blogs: blog._id}).lean().exec().catch(done);
            const client = tumblr.createClient({
                consumer_key: process.env.TUMBLR_TOKEN || config.get('tumblr.token'), // eslint-disable-line camelcase
                consumer_secret: process.env.TUMBLR_TOKEN_SECRET || config.get('tumblr.tokenSecret'), // eslint-disable-line camelcase
                token,
                token_secret: tokenSecret // eslint-disable-line camelcase
            });

            client.reblog(blog.url, {
                id: post.postId,
                reblog_key: post.reblogKey // eslint-disable-line camelcase
            }, async err => {
                if (err) {
                    return done(err);
                }

                try {
                    await Post.findOneAndRemove({_id: post._id}).lean().exec();
                    queue.posts = queue.posts.splice(queue.posts.findIndex(x => post._id === x._id), 1);
                    await queue.save();
                } catch (err) {
                    return done(err);
                }
            });
        });

        return done();
    });
};
