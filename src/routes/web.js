import passport from 'passport';
import HTTPError from 'http-errors';
import {Router} from 'express';
import {Blog, User, TumblrAccount} from '../models';
import {isAuthenticated, hasRole} from '../middleware';

const router = new Router();

router.get('/activity', isAuthenticated, (req, res) => {
    let skip = 0;
    if (req.query.page) {
        skip = req.query.page * 50;
    }
    const blogs = [];
    req.user.tumblr.forEach(tumblr => {
        tumblr.blogs.forEach(blog => {
            blogs.push({
                blogId: blog.id
            });
        });
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

router.delete('/tumblr-account/:tumblrAccountId', isAuthenticated, async (req, res, next) => {
    const tumblrAccount = await TumblrAccount.findOne({_id: req.params.tumblrAccountId}).exec().catch(err => next(err));
    if (tumblrAccount) {
        tumblrAccount.remove().then(success => {
            if (success) {
                // @TODO: Return something here
                return res.status(200).send({});
            }
            return next(new Error('No clue what happened.'));
        }).catch(err => next(err));
    }
});

router.get('/auth', isAuthenticated, (req, res) => {
    res.send(`<a href="/auth/tumblr?api_key=${req.user.apiKey}">Authenticate</a><pre>${req.user}</pre>`);
});

router.get('/auth/tumblr', isAuthenticated, (req, res, next) => {
    // This allows us to relink blogs easier by linking them to their old tumblrAccount in the db.
    const existingId = req.query._id ? `&_id=${req.query._id}` : '';
    passport.authenticate('tumblr', {
        callbackURL: `/auth/tumblr/callback?api_key=${req.user.apiKey}${existingId}`,
        session: false
    })(req, res, next);
});

router.get('/auth/tumblr/callback', isAuthenticated, passport.authenticate('tumblr', {
    session: false
}), async (req, res, next) => {
    const {token, secret, profile} = req.authInfo;

    // We're replacing the token and secret on an exiting account.
    if (req.query._id) {
        // Find tumblr account which has the main blog.
        const tumblrAccount = await TumblrAccount.findOne({_id: req.query._id}).exec().catch(next);

        if (tumblrAccount) {
            tumblrAccount.token = token;
            tumblrAccount.secret = secret;
            tumblrAccount.save().then(() => {
                return res.send({tumblrAccount});
            }).catch(next);
        } else {
            return next(new HTTPError.NotFound(`Couldn't find TumblrAccount with that _id.`));
        }
    } else {
        const mainBlog = await Blog.findOne({
            url: profile.username
        }).exec().catch(next);

        const tumblrAccount = await TumblrAccount.findOne({
            blogs: mainBlog
        }).exec().catch(next);

        // Find user who owns this tumblr account.
        if (tumblrAccount) {
            return res.send({tumblrAccount});
        }

        // No tumblr account exists so let's make one and link it to our user.
        const toCreate = profile._json.response.user.blogs.map(blog => {
            return {
                url: blog.url.replace('http://', '').replace('https://', '').replace('.tumblr.com', '').replace('/', ''),
                postCount: blog.total_posts,
                isNsfw: blog.is_nsfw,
                followerCount: blog.followers,
                primary: blog.primary,
                public: blog.type === 'public'
            };
        });

        // Remove blogs that exist in the db
        toCreate.filter(blog => {
            return Blog.count({url: blog.url}).exec().catch(next);
        });

        const blogs = await Blog.create(toCreate).catch(next);
        const newTumblrAccount = await TumblrAccount.create({
            token,
            secret,
            blogs,
            enabled: true
        }).catch(next);

        const user = await User.findOne({
            apiKey: req.query.api_key
        }).exec().catch(next);

        user.tumblr.push(newTumblrAccount);
        await user.save().catch(next);

        return res.redirect('/');
    }
});

router.get('/userCount', isAuthenticated, hasRole('admin'), async (req, res, next) => {
    const userCount = await User.count().exec().catch(next);
    res.send({
        userCount
    });
});

export default router;
