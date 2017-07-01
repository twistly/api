import Database from '../api/database';
import Blog from '../api/models/blog';
import {generalLogger as log} from '../api/log';

new Database('mongodb://localhost/twistly'); // eslint-disable-line

const setupBlogs = async agenda => {
    const blogs = await Blog.find().populate('tumblr').exec().catch(log.error);
    log.info(`Found ${blogs.length} blogs, adding them to job list.`);
    blogs.forEach(blog => {
        log.info(`Adding ${blog.url} to job list.`);
        agenda.create('stats', blog).unique({
            url: blog.url
        }, {
            insertOnly: true
        }).repeatEvery('10 seconds').save();
    });
};

export default setupBlogs;
