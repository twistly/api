import async from 'async';
import passport from 'passport';
import {Router} from 'express';

import {
    User,
    TokenSet,
    Blog,
    Invite
} from '../models';

import {apiLogger as log} from '../log';
import {isAuthenticated, hasRole} from '../middleware';

const router = new Router();

router.get('/activity', isAuthenticated, (req, res) => {
    let skip = 0;
    if (req.query.page) {
        skip = req.query.page * 50;
    }
    const blogs = [];
    async.each(req.user.tokenSet, (tokenSet, callback) => {
        async.each(tokenSet.blogs, (blog, callback) => {
            blogs.push({
                blogId: blog.id
            });
            callback();
        });
        callback();
    });
    // This is to stop xo warnings until I fix this whole route
    res.send({skip});
    // PostSet.find({
    //     $or: blogs
    // }).skip(skip).limit(50).sort('-_id').lean().populate('blogId').exec((err, postSets) => {
    //     if (err) {
    //         res.send(err);
    //     }
    //     res.render('activity', {
    //         postSets
    //     });
    // });
});

router.delete('/token-set/:tokenSetId', isAuthenticated, async (req, res, next) => {
    const tokenSet = await TokenSet.findOne({_id: req.params.tokenSetId}).exec().catch(err => next(err));
    if (tokenSet) {
        tokenSet.remove().then(success => {
            if (success) {
                // @TODO: Return something here
                return res.status(200).send({});
            }
            return next(new Error('No clue what happened.'));
        }).catch(err => next(err));
    }
});

router.get('/auth/tumblr', isAuthenticated, passport.authenticate('tumblr'));

router.post('/auth/tumblr/callback', async (req, res, next) => {
    const {token, tokenSecret} = info;
    const blogs = info.tumblr._json.response.user.blogs;
    // @TODO: We should be getting user back from passport
    const foundUser = await User.findOne({_id: req.user.id}).exec().catch(err => next(err));
    const blog = await Blog.findOne({url: blogs[0].name}).exec().catch(err => next(err));
    const tokenSet = await TokenSet.findOne({blogs: blog.id}).exec().catch(err => next(err));
    if (foundUser) {
        log.debug(`We found ${foundUser.username} which is the same as ${user}`);
        // if (blog) {
        //     if (tokenSet) {
        //         tokenSet.token = token;
        //         tokenSet.tokenSecret = tokenSecret;
        //         tokenSet.enabled = true;
        //         tokenSet.errorMessage = undefined;
        //         User.findOne({
        //             _id: req.user.id,
        //             tokenSet: tokenSet.id
        //         }, (err, tokenUser) => {
        //             if (err) {
        //                 console.log(err);
        //             }
        //             if (tokenUser) {
        //                 tokenSet.save((err, tokenSet) => {
        //                     if (err) {
        //                         next(err);
        //                     }
        //                     if (tokenSet) {
        //                         res.redirect('/');
        //                     }
        //                 });
        //             } else {
        //                 user.tokenSet.push(tokenSet.id);
        //                 user.save((err, user) => {
        //                     if (err) {
        //                         next(err);
        //                     }
        //                     if (user) {
        //                         tokenSet.save((err, tokenSet) => {
        //                             if (err) {
        //                                 next(err);
        //                             }
        //                             if (tokenSet) {
        //                                 res.redirect('/');
        //                             }
        //                         });
        //                     }
        //                 });
        //             }
        //         });
        //     }
        // } else {
        //     /*
        //      * @TODO: Create blog as we don't have it in the db,
        //      * there's a change this is because they changed their URL
        //      * we need to add something to track URL changes.
        //      */
        // }
    }
});

router.get('/genToken', isAuthenticated, hasRole('admin'), (req, res) => {
    Invite.create({
        token: (function() {
            // http://stackoverflow.com/questions/9719570/generate-random-password-string-with-requirements-in-javascript
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
            const stringLength = 16;
            let randomString = '';
            let charCount = 0;
            let numCount = 0;
            let rnum = 0;

            for (let i = 0; i < stringLength; i++) {
                // If random bit is 0, there are less than 3 digits already saved, and there are not already 5 characters saved, generate a numeric value.
                if (((Math.floor(Math.random() * 2) === 0) && numCount < 3) || charCount >= 5) {
                    rnum = Math.floor(Math.random() * 10);
                    randomString += rnum;
                    numCount += 1;
                } else {
                    // If any of the above criteria fail, go ahead and generate an alpha character from the chars string
                    rnum = Math.floor(Math.random() * chars.length);
                    randomString += chars.substring(rnum, rnum + 1);
                    charCount += 1;
                }
            }
            return randomString;
        })()
    }, (err, invite) => {
        if (err) {
            console.log(err);
        }
        res.send(invite);
    });
});

router.get('/unusedTokens', isAuthenticated, hasRole('admin'), (req, res) => {
    Invite.find({
        used: false
    }).select('token').exec((err, invites) => {
        if (err) {
            console.log(err);
        }
        res.send({
            count: invites.length,
            invites
        });
    });
});

router.get('/userCount', isAuthenticated, hasRole('admin'), (req, res) => {
    User.count((err, userCount) => {
        if (err) {
            console.log(err);
        }
        res.send({
            userCount
        });
    });
});

export default router;
