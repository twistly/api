import {Router} from 'express';
//
// import {Stat} from '../models';
//
// import {resolveBlogUrl} from '../middleware';

const router = new Router();
//
// router.get('/:blogUrl', resolveBlogUrl, async (req, res, next) => {
//     const limit = Math.min(366, Number(req.query.limit));
//     const stats = await Stat.find({blogId: req.blog._id}).limit(limit).exec().catch(err => next(err));
//     res.send({
//         stats
//     });
// });

export default router;
