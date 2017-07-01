import {blog} from '../../api/';
import * as types from '../mutation-types';

const state = {
    blogs: [],
    blogError: null
};

const getters = {
    blogs: state => state.blogs,
    blogByUrl: (state, url) => {
        return state.blogs.find(blog => {
            if (blog) {
                return blog.url === url;
            }
            return null;
        });
    },
    blogById: (state, id) => {
        return state.blogs.find(blog => {
            if (blog) {
                return blog.id === id;
            }
            return null;
        });
    }
};

const actions = {
    // Gets all the blogs from Twistly
    getAllBlogs({commit}) {
        return new Promise((resolve, reject) => {
            blog.getBlogs().then(({blogs}) => {
                commit(types.BLOG_RECIEVE_MULTIPLE, {blogs});
                resolve({blogs});
            }).catch(err => {
                const {error, stack} = err.response.data;
                commit(types.AUTHENTICATION_FAILURE, {error, stack});
                reject(err);
            });
        });
    }
};

const mutations = {
    // Add multiple blogs to the store
    [types.BLOG_RECIEVE_MULTIPLE](state, {blogs}) {
        state.blogs = blogs;
    },
    // Add a single series to the store
    [types.BLOG_RECIEVE_SINGULAR](state, {blog}) {
        let foundBlog = state.blogs.find(x => x.id === blog.id);
        if (foundBlog) {
            // Replace current store's version of the blog with the new one
            foundBlog = blog;
        } else {
            state.blogs.push(blog);
        }
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
