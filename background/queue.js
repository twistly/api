import tumblr from 'tumblr.js';

import Blog from '../app/models/blog';
import Post from '../app/models/post';

const failed = (job, err) => {
    job.fail(err);
    job.disable();
    job.save();
}

const Tumblr = tumblr.createClient({
    credentials: {
        consumer_key: process.env.TUMBLR_CONSUMER_KEY, // eslint-disable-line camelcase
        consumer_secret: process.env.TUMBLR_CONSUMER_SECRET // eslint-disable-line camelcase
        // token: tokenSet.token, // eslint-disable-line camelcase
        // token_secret: tokenSet.tokenSecret // eslint-disable-line camelcase
    },
    returnPromises: true
});

export default async (job, done) => {
    const data = job.attrs.data;
    const blog = await Blog.findOne({url: data.url}).exec();
    const post = await Post.findOne({blogId: blog._id}).exec();
    if (!blog) {
        failed(job, 'Blog is missing');
    }
    if (!post) {
        failed(job, 'Post is missing');
    }
    console.log({
        blog,
        post
    });
    // Tumblr.reblog(blog.url, {
    //     id: post.postId,
    //     reblog_key: post.reblogKey // eslint-disable-line camelcase
    // }, err => {
    //     if (err) {
    //         if (err.message === 'API error: 400 Bad Request' || err.message === 'API error: 404 Not Found') {
    //             console.log('Post was probably deleted, removing from db.');
    //         } else if (err.message === 'API error: 403 Forbidden') {
    //             console.log('Post seems to be from a user that\'s blocked them? Removing from db.');
    //         } else if (err.message === 'API error: 401 Unauthorized') {
    //             console.log('Auth has been revoked. Disabling all blogs linked to this tokenSet.');
    //         } else if (err.code === 'ETIMEDOUT') {
    //             console.log('Tumblr timedout.');
    //         } else {
    //             console.dir(err);
    //         }
    //     } else {
    //         console.log((new Date()) + ' Reblogged ' + post._id + ' to ' + blog.url);
    //         console.log((new Date()) + ' Deleted ' + post._id + ' as it was reblogged to ' + blog.url);
    //     }
    //     post.remove();
    // });
    done();
};
