export default (job, done) => {
    const data = job.attrs.data;
    const random = Math.floor(Math.random() * 100) + 1;
    if (random > 75) {
        console.log('All was good.', data);
        done();
    } else if (random > 30) {
        job.fail('Blog was disconnected from Twistly.');
        job.disable();
        job.save();
        console.log('Blog was disconnected from Twistly.', job.attrs);
    } else {
        job.fail('Failed connecting to Tumblr.');
        job.disable();
        job.save();
        console.log('Failed connecting to Tumblr.', job.attrs);
    }
};
