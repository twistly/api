import Database from '../api/database';
import Blog from '../api/models/blog';
import {generalLogger as log} from '../api/log';

const db = new Database('mongodb://localhost/twistly'); // eslint-disable-line

const x = async () => {
    log.info(db.modelNames());
    const blog = await Blog.findOne().exec();
    log.info(blog);
};

x();
