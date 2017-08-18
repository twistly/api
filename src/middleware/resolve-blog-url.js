import HTTPError from 'http-errors';
import {apiLogger as log} from '../log';
import {Blog} from '../models';

const resolveBlogUrl = async (req, res, next) => {
    const url = req.params.blogUrl;
    const blog = await Blog.findOne({url}).lean().exec().catch(err => next(err));
    if (blog) {
        req.blog = blog;
        return next();
    }
    log.debug(`Couldn't find a blog with the url ${url}.`);
    return next(new HTTPError.NotFound('No blog found with that url'));
};

export default resolveBlogUrl;
