import HTTPError from 'http-errors';
import {Router} from 'express';
import {TumblrStat} from '../models';
import {flatten} from '../utils';
import {resolveBlogUrl, isAuthenticated} from '../middleware';

const router = new Router();

router.get('/:blogUrl', resolveBlogUrl, async (req, res, next) => {
    if (!req.blog.publicStats) {
        return res.send(new HTTPError.Forbidden(`This blog has public stats turned off.`));
    }

    const limit = Math.min(366, Number(req.query.limit));
    const stats = await TumblrStat.find({blogId: req.blog._id}).limit(limit).lean().exec().catch(err => next(err));

    return res.send({stats});
});

// Anything after this requires auth
router.use(isAuthenticated);

router.get('/', async (req, res, next) => {
    const limit = Math.min(366, Number(req.query.limit));
    const blogs = flatten(req.user.tumblr.map(tumblr => tumblr.blogs));
    const stats = await TumblrStat.find({blogId: {$in: blogs}}).limit(limit).lean().exec().catch(err => next(err));

    res.send({stats});
});

export default router;
