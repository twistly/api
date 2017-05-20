import numeral from 'numeral';
import HTTPError from 'http-errors';
import {Router} from 'express';

import {
    Stat,
    User
} from '../models';

import {cors, resolveBlogUrl, isAuthenticated} from '../middleware';
import {flatten} from '../utils';

const router = new Router();

router.get('/:blogUrl/stats', resolveBlogUrl, async (req, res) => {
    const blogId = req.blog._id;
    const stats = await Stat.find({blogId}, '-_id -__v -blogId').sort('date').limit(40).exec();
    res.send({stats});
});

router.use(isAuthenticated);

router.get('/', async (req, res, next) => {
    const user = await User.findOne({_id: req.user._id}).populate({
        path: 'tokenSet',
        model: 'TokenSet',
        populate: {
            path: 'blogs',
            model: 'Blog'
        }
    }).exec().catch(err => next(err));
    const blogs = flatten(user.tokenSet.map(tokenSet => tokenSet.blogs));
    if (blogs.length >= 1) {
        return res.send({blogs});
    }
    return next(new HTTPError.NotFound(`No blogs found.`));
});

router.get('/:blogUrl', resolveBlogUrl, (req, res) => {
    res.send({blog: req.blog});
});

router.get('/:blogUrl/followers', cors, resolveBlogUrl, (req, res) => {
    const blog = req.blog;
    const linkClass = req.query.class || '';
    const linkString = req.query.name || 'followers';
    const fromTop = req.query.fromTop ? req.query.fromTop + (req.query.fromTop.slice(-2) === 'px' ? '' : 'px') : '26px';
    const fromRight = req.query.fromRight ? req.query.fromRight + (req.query.fromRight.slice(-2) === 'px' ? '' : 'px') : '4px';
    const goal = req.query.goal || 0;
    const goalString = req.query.goalName || `days till ${numeral(goal).format('0a')}`;
    const gainsPerMonth = req.query.gainsPerMonth || 0;
    const gainsPerDay = gainsPerMonth ? (gainsPerMonth / 30) : req.query.gainsPerDay;
    const followers = numeral(blog.followerCount).format('0,0');
    const href = `https://twistly.xyz/blog/${blog.url}/stats`;
    const daysToGoal = (Math.floor((goal - blog.followerCount) / gainsPerDay)) < 0 ? 0 : (Math.floor((goal - blog.followerCount) / gainsPerDay));
    const content = goal ? `${daysToGoal} ${goalString}` : `${followers} ${linkString}`;

    if (req.query.format === 'html') {
        res.setHeader('content-type', 'application/javascript');

        if (req.query.style === 'false') {
            return res.send(`
                document.write('<a class="${linkClass}" href="${href}">${content}</a>');
            `.trim());
        }

        return res.send(`
            document.write('<a id="" style="position: fixed; top: ${fromTop}; right: ${fromRight}" class="${linkClass}" href="${href}">${content}</a>');
        `.trim());
    }

    return res.send({
        followers
    });
});

export default router;
