import {Router} from 'express';
import Joi from 'joi';
import HTTPError from 'http-errors';
import dumbPasswords from 'dumb-passwords';
import jwt from 'jsonwebtoken';
import d from 'debug';
import {isAuthenticated} from '../middleware';
import {User} from '../models';
import log from '../log';
import config from '../config';
import agenda from '../lib/agenda';

const debug = d('twistly:routes:user');
const router = new Router();

debug('File loaded by Twistly.');

router.get('/', isAuthenticated, async (req, res) => {
    debug('GET /');
    res.send({
        user: req.user
    });
});

router.post('/', (req, res, next) => {
    debug('POST /');
    Joi.validate({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    }, {
        username: Joi.string().required(),
        password: Joi.string().required().min(5).max(128),
        email: Joi.string().email().required()
    }, async (error, values) => {
        if (error) {
            debug(error);
            return next(error);
        }

        debug('No errors while validating %O', values);
        const {username, password, email} = values;
        if (dumbPasswords.check(password)) {
            debug('Bad password');
            return next(new HTTPError.UnprocessableEntity(`Bad little human, use a better password.`));
        }

        if (password === username) {
            debug('Username is password');
            return next(new HTTPError.UnprocessableEntity(`We don't allow usernames and passwords to be the same thing. That's not really a smart move.`));
        }

        const user = new User({
            username,
            password,
            email
        });

        debug('Saving user');
        user.save(async error => {
            if (error) {
                if (error.name === 'MongoError' && error.code === 11000) {
                    return next(new HTTPError.Conflict(`Username and/or email already taken.`));
                }
                log.error(error);
                return next(new HTTPError.InternalServerError(`User could not be saved.`));
            }

            const {_id, username, roles} = await User.findOne({_id: user._id}).lean().exec();

            jwt.sign({
                username,
                roles,
                iat: Math.floor(Date.now() / 1000) - 5, // Set issue date 5 seconds ago
                iss: 'https://api.twistly.xyz',
                aud: 'https://api.twistly.xyz',
                maxAge: 3600
            }, config.get('jwt.secret'), {
                expiresIn: 3600
            }, (err, token) => {
                if (err) {
                    return next(err);
                }

                log.debug('Sending JWT to client and registration email to user.');

                agenda.now('registration email', {userId: _id});
                return res.status(201).send({
                    token
                });
            });
        });
    });
});

export default router;
