import HTTPError from 'http-errors';

import {User} from '../models';

const isAuthenticated = async (req, res, next) => {
    const apiKey = req.body.apiKey || req.query.apiKey || req.query.api_key;
    // @TODO: Remove this after adding in JWT support
    // This is helpful for testing and for valid existing sessions
    if (req.user) {
        return next();
    }
    if (apiKey) {
        const user = await User.findOne({apiKey}).populate('tokenSet').populate('plan').exec().catch(err => next(err));
        if (user) {
            req.user = user;
            return next();
        }
        return next(new HTTPError.Forbidden('API key is invalid.'));
    }
    return next(new HTTPError.Forbidden('No API key was provided.'));
};

export default isAuthenticated;
