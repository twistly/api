<template>
    <div class="row">
        {{newQueue}}
        <div v-if="displayErrors" class="error">{{error}} {{stack}}</div>
        <template v-if="queues.length >= 1">
            <div v-for="queue in queues" class="form-panel col-md-4 col-sm-4 mb">
                <form class="form-horizontal style-form">
                    <div class="form-group">
                        <label class="col-sm-2 control-label">Start time</label>
                        <div class="col-sm-10">
                            <p class="form-control-static">{{queue.startHour}}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-2 control-label">End time</label>
                        <div class="col-sm-10">
                            <p class="form-control-static">{{queue.endHour}}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-2 control-label">Amount of posts</label>
                        <div class="col-sm-10">
                            <p class="form-control-static">{{queue.interval}}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-2 control-label">Last run time</label>
                        <div class="col-sm-10">
                            <p class="form-control-static">
                                <time datetime="2017-05-26T06:29:23.721Z">2017-05-26T06:29:23.721Z</time>
                            </p>
                        </div>
                    </div>
                </form>
                <button @clicl="deleteQueue(queue._id)" class="btn btn-theme04">Delete</button>
            </div>
        </template>
        <div v-else>
            No Queues found.
            <button @click="showModal" class="btn">Create a new queue?</button>
            <modal name="new-queue" :adaptive="true">
                <div class="form-panel">
                    <form class="form-horizontal">
                        <div class="form-group">
                            <label class="col-sm-4 control-label">Amount of posts per queue</label>
                            <div class="col-sm-8">
                                <input type="number" v-model="newQueue.interval" min="1" max="250" class="form-control"/>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-4 control-label">Blogs that use this queue</label>
                            <div class="col-sm-8">
                                <!-- Blogs: {{newQueue.blogs}} -->
                                <!-- Add this back once the issue is fixed -->
                                <!-- <typeahead :source="typeaheadSource" :onSelect="onSelect" :onChange="onChange" :limit="5"></typeahead> -->
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-4 control-label">Start Hour (0 - 24)</label>
                            <div class="col-sm-8">
                                <input type="number" v-model="newQueue.startHour" min="0" max="24" class="form-control"/>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-4 control-label">End Hour (0 - 24)</label>
                            <div class="col-sm-8">
                                <input type="number" v-model="newQueue.endHour" min="0" max="24" class="form-control"/>
                            </div>
                        </div>
                        <button @click="addQueue">Add queue</button>
                    </form>
                </div>
            </modal>
        </div>
    </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex';

export default {
    name: 'queues',
    props: {
        displayErrors: Boolean
    },
    data() {
        return {
            error: null,
            stack: null,
            loading: false,
            newQueue: {
                blogs: [],
                interval: null,
                startHour: null,
                endHour: null
            }
        };
    },
    mounted() {
        const vm = this;
        vm.loading = true;
        vm.getQueues({}).catch(() => {
            vm.error = vm.queueError || null;
            vm.stack = vm.queueStack || null;
            vm.showError = vm.hasRole('admin') || false;
        }).then(vm.finishedLoading);
    },
    computed: {
        ...mapGetters([
            'blogs',
            'hasRole',
            'queues',
            'queueError',
            'queueStack',
            'isAuthenticated'
        ]),
        typeaheadSource() {
            const vm = this;
            return vm.blogs.slice(0).map(blog => {
                return blog.url;
            });
        }
    },
    methods: {
        ...mapActions([
            'getQueues'
        ]),
        finishedLoading() {
            const vm = this;
            return new Promise(resolve => {
                vm.loading = false;
                resolve();
            });
        },
        showModal() {
            this.$modal.show('new-queue');
        },
        addQueue() {
            //
        },
        onSelect(value) {
            this.value = value;
        },
        onChange(value) {
            this.value = value;
        }
    }
};
</script>

<style scoped>
.form-horizontal.style-form .form-group:last-of-type {
    border: none;
    padding-bottom: 0;
    margin-bottom: 0;
}
.shuffle {
    margin: 0;
}
</style>
