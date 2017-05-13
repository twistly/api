import Agenda from 'agenda';

const agenda = new Agenda({
    db: {
        address: 'mongodb://127.0.0.1/agenda'
    }
});

agenda.define('send email report', {
    priority: 'high',
    concurrency: 10
}, ({attrs: {data}}, done) => {
    console.log(data);
    done();
});

agenda.on('ready', () => {
    agenda.schedule('2 hours', 'send email report', {to: 'admin@example.com'});
    agenda.start();
});
