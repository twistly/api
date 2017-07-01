import api from './api';

const getQueues = () => {
    return new Promise((resolve, reject) => {
        api.get('queue').then(({data}) => {
            resolve({queues: data.queues});
        }).catch(reject);
    });
};

export default {
    getQueues
};
