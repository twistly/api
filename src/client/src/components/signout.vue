<template>
    <h1>Signing out.</h1>
</template>

<script>
import {mapActions} from 'vuex';

export default {
    name: 'signout',
    mounted() {
        const vm = this;
        vm.signout();
        vm.$router.push({
            name: 'home'
        });
    },
    methods: {
        ...mapActions([
            'signout'
        ])
    }
};
</script>
