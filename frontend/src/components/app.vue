<template>
    <loader v-if="loading" type="square"></loader>
    <section v-else id="container">
        <header class="header black-bg">
            <div v-if="isAuthenticated" class="sidebar-toggle-box">
                <div class="fa fa-bars tooltips" @click="toggleSidebar"></div>
            </div>
            <router-link :to="{ name: 'home' }" class="logo"><b>Twistly</b></router-link>
            <div v-if="!maintenanceMode" class="top-menu">
                <ul class="nav pull-right top-menu">
                    <template v-if="isAuthenticated">
                        <li>
                           <button v-if="hasRole('admin')" @click="toggleErrors" class="error-button">{{displayErrors ? 'Hide' : 'Show'}} errors</button>
                        </li>
                        <li>
                            <router-link :to="{ name: 'signout' }" class="auth-button">Signout</router-link>
                        </li>
                    </template>
                    <template v-else>
                        <li>
                            <router-link :to="{ name: 'signin' }" class="auth-button">Signin</router-link>
                        </li>
                        <li>
                            <router-link :to="{ name: 'signup' }" class="auth-button">Signup</router-link>
                        </li>
                    </template>
                </ul>
            </div>
        </header>
        <sidebar v-if="isAuthenticated" :open="sidebarOpen" :blogs="blogs" :user="user"></sidebar>
        <section id="main-content" :class="isAuthenticated ? sidebarOpen ? '' : 'sidebar-closed' : 'sidebar-closed'">
            <section class="wrapper">
                <router-view v-if="!maintenanceMode" :display-errors="displayErrors"></router-view>
                <div v-else>Twistly is currently in maintenance mode and will be back online soon.</div>
            </section>
        </section>
        <span v-if="env !== 'production'" class="env">{{env}} v{{version}}</span>
    </section>
</template>

<script>
import {mapGetters, mapActions} from 'vuex';

import api from '../api';
import {env} from '../utils';
import {version} from '../../package';

import loader from './loader.vue';
import sidebar from './sidebar.vue';

export default {
    name: 'app',
    data() {
        return {
            env,
            version,
            sidebarOpen: false,
            loading: false,
            maintenanceMode: false,
            displayErrors: false
        };
    },
    mounted() {
        const vm = this;
        vm.loading = true;
        api.get('/healthcheck').then(vm.checkAuth).then(({token}) => {
            vm.sidebarOpen = localStorage.getItem('sidebar') === 'true';
            return token;
        }).then(token => {
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
            'hasRole',
            'blogs',
            'user',
            'userError',
            'isAuthenticated'
        ])
    },
    methods: {
        ...mapActions([
            'getUser',
            'getAllBlogs',
            'checkAuth'
        ]),
        toggleSidebar() {
            const vm = this;
            localStorage.setItem('sidebar', !vm.sidebarOpen);
            vm.sidebarOpen = !vm.sidebarOpen;
        },
        toggleErrors() {
            const vm = this;
            localStorage.setItem('displayErrors', !vm.displayErrors);
            vm.displayErrors = !vm.displayErrors;
        }
    },
    components: {
        loader,
        sidebar
    }
};
</script>

<style>
@import "https://cdn.rawgit.com/OmgImAlexis/Twistly/aa19fe07f2aa1dc7eeb79921ceb1e8f33ac1c08f/app/public/css/vender.min.css";
@import "https://cdn.rawgit.com/OmgImAlexis/Twistly/aa19fe07f2aa1dc7eeb79921ceb1e8f33ac1c08f/app/public/assets/css/style.css";
@import "https://cdn.rawgit.com/OmgImAlexis/Twistly/aa19fe07f2aa1dc7eeb79921ceb1e8f33ac1c08f/app/public/assets/css/style-responsive.css";
@import "https://cdn.rawgit.com/OmgImAlexis/Twistly/aa19fe07f2aa1dc7eeb79921ceb1e8f33ac1c08f/app/public/css/core.min.css";
#nav-accordion {
    height: 100%;
    overflow: scroll;
}
span.credit {
    background: #424a5d;
    padding-top: 5px;
}
#main-content {
    padding: 10px;
    margin: 0;
}
.sidebar-closed #sidebar {
    margin-left: -210px;
}
.error {
    border: 3px solid red;
    padding: 5px;
}
</style>
<style scoped>
.auth-button {
    color: #f2f2f2;
    font-size: 12px;
    border-radius: 4px;
    -webkit-border-radius: 4px;
    border: 1px solid #64c3c2 !important;
    padding: 5px 15px;
    margin-right: 15px;
    background: #68dff0;
    margin-top: 15px;
}
.error-button {
    color: azure;
    font-size: 12px;
    border-radius: 4px;
    -webkit-border-radius: 4px;
    border: 1px solid indianred !important;
    padding: 5px 15px;
    margin-right: 15px;
    background: indianred;
    margin-top: 15px;
}
#main-content {
    margin-left: 210px;
}
#main-content.sidebar-closed {
    margin: 0;
}
</style>

<style scoped>
.env {
    background-color: #333;
    color: #DDD;
    position: fixed;
    bottom: 2px;
    right: 2px;
    padding: 7px;
}
</style>
