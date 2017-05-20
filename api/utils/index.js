// @TODO: Give these better names.

const canAccessBlog = (user, blogUrl) => {
    for (let i = 0; i < user.tokenSet.length; i++) {
        for (let j = 0; j < user.tokenSet[i].blogs.length; j++) {
            if (user.tokenSet[i].blogs[j].url.toLowerCase() === blogUrl.toLowerCase()) {
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
    canAccessBlog,
    postsLeftInPlan,
    flatten
};
