import {
    Blog
} from '../models';

const blogUrl = async (req, res, next) => {
    const url = req.query.params.blogUrl;
    const blog = await Blog.findOne({url}).exec();
    if (blog) {
        req.blog = blog;
        next();
    } else {
        next(new Error('No blog found with that url.'));
    }
};

export default blogUrl;
