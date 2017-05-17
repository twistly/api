import {Router} from 'express';
import async from 'async';

import {
    User,
    Blog,
    Notification,
    PostSet,
    Post
} from '../models';

import {
    canAccessBlog,
    postsLeftInPlan
} from '../utils';

const app = new Router();

app.get('/api/check', (req, res) => {
    res.send({
        ok: 'okay'
    });
});

app.get('/api/apiKey', (req, res) => {
    return res.send({
        apiKey: req.user.apiKey
    });
});

// Add posts to your queue
app.post('/api/posts', async (req, res) => {
    const blogUrl = req.body.blogUrl;
    const posts = req.body.posts;
    const queuedFrom = req.body.queuedFrom;

    if (canAccessBlog(req.user, blogUrl)) {
        const blog = await Blog.findOne({
            url: blogUrl
        }).exec();
        if (blog) {
            if (postsLeftInPlan(blog, req.user.plan) <= posts.length) {
                return res.send({
                    error: 'You can only have ' + req.user.plan.maxPosts + ' posts in your queue, you currently have ' + blog.postsInQueue
                });
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
                new PostSet({
                    posts: newPosts,
                    blogId: blog.id,
                    queuedFrom,
                    clearCaption: false,
                    postCount: {
                        start: newPosts.length,
                        now: newPosts.length
                    }
                }).save().then(res.sendStatus(201));
            });
        }
    }
});

app.get('/api/blogs', (req, res, next) => {
    async.each(req.user.tokenSet, (tokenSet, callback) => {
        tokenSet.populate({
            path: 'blogs'
        }, err => {
            if (err) {
                console.log(err);
            }
            async.each(tokenSet.blogs, (blog, callback) => {
                blog.populate({
                    path: 'notifications'
                }, (err, result) => {
                    if (err) {
                        callback(err);
                    }
                    if (result) {
                        callback();
                    }
                });
            }, err => {
                if (err) {
                    callback(err);
                }
                callback();
            });
        });
    }, err => {
        if (err) {
            next(err);
        }
        const blogs = [];
        if (req.user.tokenSet.length >= 1) {
            for (let i = 0; i < req.user.tokenSet.length; i++) {
                for (let k = 0; k < req.user.tokenSet[i].blogs.length; k++) {
                    const blog = req.user.tokenSet[i].blogs[k];
                    blogs.push({
                        url: blog.url,
                        postCount: blog.postCount,
                        followerCount: blog.followerCount
                    });
                }
            }
            res.send({
                ok: 'okay',
                blogs
            });
        } else {
            res.send({
                error: 'No blogs found',
                blogs
            });
        }
    });
});

export default app;
