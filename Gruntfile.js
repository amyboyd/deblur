'use strict';

module.exports = function (grunt) {
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        concat: {
            dist: {
                src: [
                    'scripts/main.js',
                    'scripts/angular.js',
                ],
                dest: 'dist/concat-src-es6.js',
            }
        },

        babel: {
            dist: {
                options: {
                    sourceMap: false
                },
                files: {
                    'dist/concat-src-es5.js': ['dist/concat-src-es6.js']
                }
            }
        },

        watch: {
            js: {
                files: ['scripts/*.js'],
                tasks: ['js'],
                options: {
                    spawn: false,
                },
            },
        },
    });

    grunt.registerTask('default', [
        'js',
        'watch',
    ]);

    grunt.registerTask('js', [
        'concat',
        'babel',
    ]);
};
