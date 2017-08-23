import nodemailer from 'nodemailer';
import d from 'debug';
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
    debug('defining registration email');
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
};
