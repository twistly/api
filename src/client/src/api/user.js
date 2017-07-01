import api from './api';

const getUser = () => {
    return new Promise((resolve, reject) => {
        api.get('user').then(({data}) => {
            resolve({user: data.user});
        }).catch(reject);
    });
};

export default {
    getUser
};
