import crypto from 'crypto';
import nodemailer from 'nodemailer';
import d from 'debug';
import uuidv4 from 'uuid/v4';
import {User} from '../models';

const debug = d('twistly:jobs:email');
debug('loaded');
const email = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

export default agenda => {
    agenda.define('registration email', async (job, done) => {
        debug(`Trying to send registration email to ${job.attrs.data.userId}`);
        const user = await User.findOne({_id: job.attrs.data.userId}).lean().exec().catch(err => {
            debug(err);
            done(err);
        });

        debug(`Using ${user.email} for ${user._id}'s registration email'`);

        email.verify(error => {
            if (error) {
                debug(error);
                return done(error);
            }
            email.sendMail({
                from: 'no-reply@twistly.xyz',
                to: `${user.username} <${user.email}>`,
                subject: 'Welcome to Twistly ✔',
                html: '<b>Welcome to Twistly.</b>'
            }, (error, info) => {
                if (error) {
                    debug(error);
                    return done(error);
                }
                debug('Message %s sent: %s', info.messageId, info.response);
                return done();
            });
        });
    });

    agenda.define('forgotten password email', async (job, done) => {
        debug(`Trying to send forgotten password email to ${job.attrs.data.userId}`);
        const user = await User.findOne({_id: job.attrs.data.userId}).lean().exec().catch(err => {
            debug(err);
            done(err);
        });

        debug(`Using ${user.email} for ${user._id}'s forgotten password email'`);

        email.verify(error => {
            if (error) {
                debug(error);
                return done(error);
            }
            const resetCode = crypto.createHash('sha256').update(uuidv4()).update('salt').digest('hex');
            email.sendMail({
                from: 'no-reply@twistly.xyz',
                to: `${user.username} <${user.email}>`,
                subject: 'Password reset!',
                html: `
                    Someone requested a password reset for this email on Twistly.xyz.<br>
                    If you requested a reset please click <a href="https://twistly.xyz/reset-password?resetCode=${resetCode}">here</a> to reset your password.
                    <br><br>
                    If you didn't request a reset please let us know by emailing support@twistly.xyz
                    or reaching out to us on Twitter <a href="https://twitter.com/twistlyapp">@Twistlyapp</a>.
                `
            }, (error, info) => {
                if (error) {
                    debug(error);
                    return done(error);
                }
                debug('Message %s sent: %s', info.messageId, info.response);
                return done();
            });
        });
    });
};
