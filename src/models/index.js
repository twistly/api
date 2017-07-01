import mongoose from 'mongoose';

import Blog from './blog';
import Notification from './notification';
import Plan from './plan';
import Post from './post';
import Queue from './queue';
import TumblrStat from './tumblr-stat';
import TumblrAccount from './tumblr-account';
import User from './user';

mongoose.Promise = global.Promise;

export {
    Blog,
    Notification,
    Plan,
    Post,
    Queue,
    TumblrStat,
    TumblrAccount,
    User
};
