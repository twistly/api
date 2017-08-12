import announce from './announce';

const canAccessBlog = (user, blogUrl) => {
    for (let i = 0; i < user.tumblr.length; i++) {
        for (let j = 0; j < user.tumblr[i].blogs.length; j++) {
            if (user.tumblr[i].blogs[j].url.toLowerCase() === blogUrl.toLowerCase()) {
                return true;
            }
        }
    }
};

const postsLeftInPlan = (blog, plan) => {
    return plan.maxPosts - blog.postsInQueue;
};

const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

export {
    announce,
    canAccessBlog,
    postsLeftInPlan,
    flatten
};
