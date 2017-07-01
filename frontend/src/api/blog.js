import api from './api';

const getBlogs = () => {
    return new Promise((resolve, reject) => {
        api.get('blog').then(({data}) => {
            resolve({blogs: data.blogs});
        }).catch(reject);
    });
};

export default {
    getBlogs
};
