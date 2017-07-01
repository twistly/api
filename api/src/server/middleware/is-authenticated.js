import HTTPError from 'http-errors';

import {authenticationLogger as log} from '../log';
import {User} from '../models';

const isAuthenticated = async (req, res, next) => {
    const apiKey = req.body.apiKey || req.query.apiKey || req.query.api_key;
    const jwt = (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') ? req.headers.authorization.split(' ')[1] : '';
    if (apiKey || jwt) {
        log.error(`JWT ISN'T BEING CHECKED HERE, MAKE SURE TO CHANGE BEFORE LAUNCHING.`);
        const find = jwt === '' ? {apiKey} : {apiKey: 'x'};
        const user = await User.findOne(find).populate('tumblr').populate('plan').exec().catch(err => next(err));
        if (user) {
            req.user = user;
            return next();
        }
        return next(new HTTPError.Forbidden('API key is invalid.'));
    }
    return next(new HTTPError.Forbidden('No API key or JWT was provided.'));
};

export default isAuthenticated;
