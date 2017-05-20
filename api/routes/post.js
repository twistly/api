import HTTPError from 'http-errors';

import {Router} from 'express';

import {
    Post,
    Notification
} from '../models';

import {apiLogger as log} from '../log';
import {canUserAccessBlog} from '../middleware';
import {postsLeftInPlan} from '../utils';

const router = new Router();

router.get('/', canUserAccessBlog, (req, res) => {
    const blogId = req.blog._id;
    const posts = Post.find({blogId}).limit(100).exec();
    res.send({posts});
});

// Add posts to your queue
router.post('/', canUserAccessBlog, async (req, res, next) => {
    const posts = req.body.posts;
    const queuedFrom = req.body.queuedFrom;
    const blog = req.body.blog;

    if (postsLeftInPlan(blog, req.user.plan) <= posts.length) {
        log.debug(`${req.user.username} tried adding ${posts.length} to their queue. Current queue: ${blog.postsInQueue}/${req.user.plan.maxPosts}`);
        return next(new HTTPError.TooManyRequests(`You tried adding ${posts.length} to your queue. Current queue: ${blog.postsInQueue}/${req.user.plan.maxPosts}`));
    }
    const newPosts = [];
    for (const id in posts) {
        if ({}.hasOwnProperty.call(posts, id)) {
            const post = new Post({
                blogId: blog.id,
                postId: id,
                reblogKey: posts[id].reblogKey
            });
            post.save();
            newPosts.push(post.toObject());
        }
    }
    new Notification({
        to: queuedFrom, // Who the notification is for
        from: blog.url, // Who caused it
        type: 'queued',
        content: {
            postsLength: posts.length
        }
    }).save().then(() => {
        blog.postsInQueue += newPosts.length;
        blog.save();
    });
});

export default router;
