<template>
    <div>
        <loader v-if="loading" type="square"></loader>
        <template v-else>
            <template v-if="isAuthenticated">
                <div v-for="blog in blogs" class="col-md-4 mb">
                    <div class="darkblue-panel pn">
                        <br>
                        <br>
                        <p><img src="http://placehold.it/60x60?text=+" class="img-circle" width="80"></p>
                        <p><b>{{blog.url}}</b></p>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="small mt">New Followers</p>
                                <p>+100</p>
                            </div>
                            <div class="col-md-6">
                                <p class="small mt">Total Followers</p>
                                <p>{{blog.followerCount}}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else>
                Replace this with a nice splash page.
            </template>
        </template>
    </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex';

import loader from './loader.vue';

export default {
    name: 'home',
    data() {
        return {
            loading: false
        };
    },
    mounted() {
        const vm = this;
        vm.checkAuth().then(({token}) => {
            if (token) {
                vm.getUser();
                vm.getAllBlogs();
            }
        }).then(() => {
            vm.loading = false;
        }).catch(err => {
            vm.loading = false;
            if (err.message === 'Network Error') {
                vm.maintenanceMode = true;
            }
        });
    },
    computed: {
        ...mapGetters([
            'isAuthenticated',
            'blogs',
            'gainedThisWeek'
        ])
    },
    methods: {
        ...mapActions([
            'getUser',
            'getAllBlogs',
            'checkAuth'
        ])
    },
    components: {
        loader
    }
};
</script>
