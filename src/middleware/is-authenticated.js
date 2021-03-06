import HTTPError from 'http-errors';

import {authenticationLogger as log} from '../log';
import {User} from '../models';

const isAuthenticated = async (req, res, next) => {
    if (req.body === undefined) {
        return next(new Error('isAuthenticated cannot be used before bodyParser middleware'));
    }

    const apiKey = req.body.apiKey || req.query.apiKey || req.query.api_key || null;
    const jwt = req.jwt || null;
    if (apiKey || jwt) {
        const find = jwt === null ? {apiKey} : {username: jwt.username};
        log.debug(`Auth looks good using ${JSON.stringify(find)} to check DB.`);
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
