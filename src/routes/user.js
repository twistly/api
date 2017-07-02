import {Router} from 'express';
import Joi from 'joi';
import HTTPError from 'http-errors';
import dumbPasswords from 'dumb-passwords';
import jwt from 'jsonwebtoken';
import {isAuthenticated} from '../middleware';
import {User} from '../models';
import log from '../log';
import config from '../config';

const router = new Router();

router.get('/', isAuthenticated, async (req, res) => {
    res.send({
        user: req.user
    });
});

router.post('/', (req, res, next) => {
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
            return next(error);
        }
        const {username, password, email} = values;
        if (dumbPasswords.check(password)) {
            return next(new HTTPError.UnprocessableEntity(`Bad little human, use a better password.`));
        }

        if (password === username) {
            return next(new HTTPError.UnprocessableEntity(`We don't allow usernames and passwords to be the same thing. That's not really a smart move.`));
        }

        const user = new User({
            username,
            password,
            email
        });
        user.save(error => {
            if (error) {
                if (error.name === 'MongoError' && error.code === 11000) {
                    return next(new HTTPError.Conflict(`Username and/or email already taken.`));
                }
                log.error(error);
                return next(new HTTPError.InternalServerError(`User could not be saved.`));
            }
            // Just to be sure we remove the password here incase we fuck up somewhere.
            const {username, roles} = user;

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
                log.debug('Sending JWT.');
                return res.status(201).send({
                    token
                });
            });
        });
    });
});

export default router;
