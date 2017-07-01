import api from './api';

const getStats = ({blogUrl, limit = 30}) => {
    return new Promise((resolve, reject) => {
        api.get(`stat/${blogUrl}`, {
            params: {
                limit
            }
        }).then(({data}) => {
            resolve({
                stats: data.stats
            });
        }).catch(reject);
    });
};

export default {
    getStats
};
