module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        clean: {
           dist: './dist/',
           bower: './bower_components' // jshint ignore:line
       },
       bower: {
            install: {
                options: {
                    copy: false
                }
            }
        },
        bower_concat: { // jshint ignore:line
            vender: {
                dest: './dist/vender.js',
                cssDest: './dist/vender.css',
                bowerOptions: {
                    relative: false
                },
                mainFiles: {
                    'bootstrap': [
                        'dist/css/bootstrap.css',
                        "dist/js/bootstrap.js"
                    ],
                    "font-awesome": [
                        "css/font-awesome.css"
                    ]
                },
                dependencies: {
                }
            }
        },
        uglify: {
            vender: {
                files: {
                    './app/public/js/vender.min.js': ['./dist/vender.js']
                }
            },
            core: {
                files: {
                    './app/public/js/core.min.js': ['./app/public/js/core.js']
                }
            }
        },
        sass: {
            options: {
            },
            core: {
                files: {
                    './dist/core.css': ['./app/public/scss/core.scss']
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            vender: {
                files: {
                    './app/public/css/vender.min.css': [
                        './dist/vender.css'
                    ]
                }
            },
            core: {
                files: {
                    './app/public/css/core.min.css': [
                        './dist/core.css'
                    ]
                }
            }
        },
        jshint: {
            options: {
                eqeqeq: true
            },
            uses_defaults: [ // jshint ignore:line
                'app.js',
                'app/**/*.js',
                'config/**/*.js'
            ]
        },
        watch: {
            scripts: {
                files: [
                    './app/public/js/*.js',
                    './app/public/scss/*.scss',
                    'bower.json'
                ],
                tasks: [
                    'uglify',
                    'sass',
                    'cssmin'
                ],
                options: {
                    spawn: false,
                }
            }
        },
        copy: {
            vender: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: 'bower_components/font-awesome',
                    src: [
                        'fonts/*.*'
                    ],
                    dest: './app/public/'
                },{
                    expand: true,
                    dot: true,
                    cwd: 'bower_components/simple-line-icons',
                    src: [
                        'fonts/*.*'
                    ],
                    dest: './app/public/'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'clean:dist',
        'bower_concat',
        'uglify',
        'sass',
        'cssmin',
        'copy'
    ]);

    grunt.registerTask('refresh', [
        'clean',
        'bower',
        'bower_concat',
        'uglify',
        'sass',
        'cssmin',
        'copy'
    ]);
};
