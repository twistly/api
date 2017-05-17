import {
    User
} from '../models';

const auth = async (req, res, next) => {
    const apiKey = req.body.apiKey || req.query.apiKey;
    if (req.user) {
        return next();
    }
    if (apiKey) {
        const user = await User.findOne({
            apiKey
        }).populate('tokenSet').populate('plan').exec();
        if (user) {
            req.user = user;
            return next();
        }
        return next(new Error('API key is invalid'));
    }
    return next(new Error('No API key was provided.'));
};

export default auth;
