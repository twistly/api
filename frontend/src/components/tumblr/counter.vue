<template>
    <div>
        tumblr/counter.vue
    </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex';

import loader from '../loader.vue';

export default {
    name: 'counter',
    data() {
        return {
            loading: false
        };
    },
    mounted() {
        const vm = this;
        vm.loading = true;
        vm.getStats({}).then(() => {
            setTimeout(() => {
                vm.loading = false;
            }, process.env.NODE_ENV === 'production' ? 0 : 2000);
        });
    },
    computed: {
        ...mapGetters([
            'stats',
            'isAuthenticated'
        ])
    },
    methods: {
        ...mapActions([
            'getStats'
        ])
    },
    components: {
        loader
    }
};
</script>
