import d from 'debug';
import Tumblr from 'tumblr.js';
import config from '../config';
import {Blog, User, TumblrStat, TumblrAccount} from '../models';

const debug = d('twistly:jobs:stat');
debug('loaded');

export default agenda => {
    agenda.define('tumblr stats', async (job, done) => {
        const {blogId, userId} = job.attrs.data;
        debug(`Checking if user [%s] is allowed to get stats`, userId);

        const user = await User.findOne({_id: userId}).select('suspended').lean().exec().catch(err => {
            debug(err);
            debug('calling done');
            return done(err);
        });

        if (user.suspended) {
            return done(`Cannot check queue as user ${userId} is suspended`);
        }

        const {_id, token, secret} = await TumblrAccount.findOne({blogs: blogId}).select('token secret').lean().exec().catch(err => {
            debug(err);
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

        debug(`Successfully connected to Tumblr for blog [%s]`, blogId);

        debug(`Getting the latest follower count for blog [%s]`, blogId);

        const blog = await Blog.findOne({_id: blogId}).exec().catch(err => {
            debug(err);
            return done(err);
        });

        client.blogInfo(blog.url, async (err, resp) => {
            if (err) {
                debug(err);
                return done(err);
            }

            debug(`Tumblr returned %O`, resp);

            debug(`Successfully got the follower count for blog [%s]`, blog._id);

            try {
                const {followers} = resp.response.user.blogs.find(x => x.name === blog.url);
                const stat = new TumblrStat({
                    blogId,
                    followerCount: followers,
                    date: new Date()
                });
                await stat.save();

                debug('Finished getting stats for blog [%s]', blog._id);
            } catch (err) {
                debug(err);
                return done(err);
            }
        });

        return done();
    });
};
