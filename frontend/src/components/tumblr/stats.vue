<template>
    <div>
        <loader v-if="loading" type="square"></loader>
        <template v-else>
            <div class="row mt">
                <div class="col-lg-12">
                    <div v-if="stats.length">
                        <div id="statTable" class="col-lg-5 col-md-6 center-block" style='float: none; color: white;'>
                            <div class="panel darkblue-panel" style='text-align: left;'>
                                <div class="panel-body">
                                    <div class="col-lg-6 col-md-6 col-sm-6 col-xs-6">
                                        <span>1 week forecast: {{format(forecast.week)}}</span>
                                        <span>1 month forecast: {{format(forecast.month)}}</span>
                                        <span>1 year forecast: {{format(forecast.year)}}</span>
                                    </div>
                                    <div class="col-lg-6 col-md-6 col-sm-6 col-xs-6">
                                        <span>Total followers: {{format(currentFollowers)}}</span>
                                        <span>Gained today: {{format(gainedToday)}}</span>
                                        <span>Last updated: {{format(lastUpdated)}}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="panel darkblue-panel">
                                <div class="panel-body">
                                    <div>
                                        <chart :chart-data="{labels: chart.day.labels, data: chart.day.data}" :options="chart.day.options"></chart>
                                        <!-- <canvas id="followersDailyLineChart" class="col-lg-6"></canvas> -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="panel darkblue-panel">
                                <div class="panel-body">
                                    <div>
                                        <canvas id="followersHourlyLineChart" class="col-lg-6"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="panel darkblue-panel">
                                <div class="panel-body">
                                    <div>
                                        <canvas id="followersDailyBarChart" class="col-lg-6"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="panel darkblue-panel">
                                <div class="panel-body">
                                    <div>
                                        <canvas id="followersHourlyBarChart" class="col-lg-6"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="panel panel-default">
                        <div class="panel-body">
                            <h5>We haven't started collecting stats for this blog yet, please check back in about an hour.</h5>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import numeral from 'numeral';
import {mapGetters, mapActions} from 'vuex';

import loader from '../loader.vue';
import chart from '../chart.vue';

export default {
    name: 'stats',
    data() {
        return {
            loading: false,
            language: navigator.language || navigator.userLanguage,
            forecast: {
                // Number(statTable.forecast.week).toLocaleString(lang)
                week: null,
                month: null,
                year: null
            },
            // Number(dailyBarChartData.datasets[0].data[dailyBarChartData.datasets[0].data.length-1]).toLocaleString(lang)
            currentFollowers: null,
            gainedToday: null,
            lastUpdate: null,
            chart: {
                day: {
                    labels: [],
                    data: [],
                    options: {}
                },
                week: [],
                month: []
            },
            datacollection: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                datasets: [{
                    label: 'GitHub Commits',
                    backgroundColor: '#f87979',
                    data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
                }, {
                    label: 'My First dataset',
                    fillColor: 'rgba(220,220,220,0.2)',
                    strokeColor: 'rgba(220,220,220,1)',
                    pointColor: 'rgba(220,220,220,1)',
                    pointStrokeColor: '#fff',
                    pointHighlightFill: '#fff',
                    pointHighlightStroke: 'rgba(220,220,220,1)',
                    data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
                }]
            }
        };
    },
    mounted() {
        const vm = this;
        vm.loading = true;
        vm.getStats({blogUrl: vm.$route.params.blogUrl}).then(({stats}) => {
            const now = new Date();
            const oneDay = 86400;

            vm.currentFollowers = stats.slice(0).sort((a, b) => {
                const distancea = Math.abs(now - a.date);
                const distanceb = Math.abs(now - b.date);
                return distancea - distanceb;
            })[0].followerCount;

            vm.chart.day.data = stats.slice(0).filter(stat => {
                const oneDayAgo = now.getTime() - oneDay;
                console.log(new Date(stat.date));
                console.log((now.getTime() - (new Date(stat.date)).getTime()) / oneDay);
                return new Date(stat.date).getTime() >= oneDayAgo;
            });
            vm.loading = false;
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
        ]),
        format(str, format = '0,0') {
            const vm = this;
            return numeral(Number(str)).format(format).toLocaleString(vm.language);
        }
    },
    components: {
        loader,
        chart
    }
};
</script>

<style>
#statTable span {
    display: block;
}
</style>
