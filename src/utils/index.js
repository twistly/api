import d from 'debug';
import {agenda} from '../lib';
import announce from './announce';

const debug = d('twistly:utils:index');

const canAccessBlog = (user, blogUrl) => {
    for (let i = 0; i < user.tumblr.length; i++) {
        for (let j = 0; j < user.tumblr[i].blogs.length; j++) {
            if (user.tumblr[i].blogs[j].url.toLowerCase() === blogUrl.toLowerCase()) {
                return true;
            }
        }
    }
};

const postsLeftInPlan = (blog, plan) => {
    return plan.maxPosts - blog.postsInQueue;
};

const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

const createQueueJob = ({queueId, userId, interval}) => {
    return new Promise((resolve, reject) => {
        if (!queueId || !userId) {
            return reject(new Error('queueId or userId param missing'));
        }

        agenda.jobs({name: 'check queue'}, (err, jobs) => {
            if (err) {
                return reject(err);
            }

            const foundUserId = jobs.find(job => job.attrs.data.userId === userId);
            const foundQueueId = jobs.find(job => job.attrs.data.queueId === queueId);

            if (foundUserId && foundQueueId) {
                debug('Skipping user [%s] with queue [%s] as I found a check queue job already in the databse.', userId, queueId);
                return resolve();
            }

            const job = agenda.create('check queue', {userId, queueId});
            job.unique({'data.userId': userId, 'data.queueId': queueId});
            job.repeatEvery(`${interval} seconds`);
            job.save(err => {
                if (err) {
                    debug(err);
                    return reject(err);
                }
                return resolve(job);
            });
        });
    });
};

export {
    announce,
    canAccessBlog,
    postsLeftInPlan,
    flatten,
    createQueueJob
};
