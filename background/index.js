import mongoose from 'mongoose';
import Agenda from 'agenda';

import queue from './queue';
import stats from './stats';

const agenda = new Agenda({
    db: {
        address: 'mongodb://127.0.0.1/agenda'
    }
});

agenda.define('stats', {
    priority: 'high',
    concurrency: 10
}, stats);

agenda.on('ready', async () => {
    const blogs = [{
        _id: new mongoose.Types.ObjectId(),
        url: 'staff'
    }, {
        _id: new mongoose.Types.ObjectId(),
        url: 'random'
    }, {
        _id: new mongoose.Types.ObjectId(),
        url: 'tom'
    }, {
        _id: new mongoose.Types.ObjectId(),
        url: 'josh'
    }, {
        _id: new mongoose.Types.ObjectId(),
        url: 'sarah'
    }, {
        _id: new mongoose.Types.ObjectId(),
        url: 'mary'
    }, {
        _id: new mongoose.Types.ObjectId(),
        url: 'harry'
    }, {
        _id: new mongoose.Types.ObjectId(),
        url: 'x'
    }];
    await blogs.forEach(blog => {
        agenda.create('stats', blog).unique({
            url: blog.url
        }, {
            insertOnly: true
        }).repeatEvery('10 seconds').save();
    });
    agenda.start();
});
