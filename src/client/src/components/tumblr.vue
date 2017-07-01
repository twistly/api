<template>
    <div>
        <router-view :display-errors="displayErrors"></router-view>
    </div>
</template>
<script>
export default {
    name: 'tumblr',
    props: {
        displayErrors: Boolean
    }
};
</script>
