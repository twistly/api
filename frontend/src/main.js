import Vue from 'vue';
import vuexI18n from 'vuex-i18n';
import VueResource from 'vue-resource';
// import VueTypeahead from 'vue-bulma-typeahead';
import VueModal from 'vue-js-modal';
import router from './router';
import store from './store';
import App from './components/app.vue';
import Loader from './components/loader.vue';

// Import translations and store
import {
    i18nstore,
    enUs
} from './i18n';

Vue.use(vuexI18n.plugin, i18nstore);
Vue.use(VueResource);
// Vue.use(VueTypeahead);
Vue.use(VueModal);
Vue.use(Loader);

// Add translations directly to Vue
Vue.i18n.add('en-us', enUs);

// Set the start locale to use
Vue.i18n.set('en-us');

new Vue({ // eslint-disable-line no-new
    el: '#app',
    router,
    render: h => h(App),
    store
});
