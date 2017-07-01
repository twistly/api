import HTTPError from 'http-errors';

import {middlewareLogger as log} from '../log';

const canUserAccessBlog = async (req, res, next) => {
    const isUserAllowed = blog => req.user.tumblr.filter(tumblr => tumblr.blogs.filter(_blog => _blog === blog._id));

    if (req.blog) {
        if (isUserAllowed(req.blog)) {
            log.debug(`${req.user.username} successfully accessed ${req.blog.url}.`);
            return next();
        }
        log.debug(`${req.user.username} was trying to access ${req.blog.url} but it doesn't have permission.`);
        return next(new HTTPError.Forbidden('You do not own this blog.'));
    }
    log.debug(`${req.user.username} tried to access the queue page without providing a blogId.`);
    return next(new HTTPError.NotFound('No blog provided.'));
};

export default canUserAccessBlog;
