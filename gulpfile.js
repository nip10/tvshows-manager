const config = require('./gulp-config.json');
const runSequence = require('run-sequence');
const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync');
const watch = require('gulp-watch');
const util = require('gulp-util');
const fs = require('fs');

const cleanFolderList = ['sass', 'scripts', 'images'];
const taskList = ['sasslint', 'sass', 'scripts', 'images'];
const watchTaskList = ['sasslint', 'sass', 'images'];

// const taskList = ['sasslint', 'sass', 'eslint', 'scripts', 'images'];
// const watchTaskList = ['sasslint', 'sass', 'eslint', 'images'];

util.env.boilerplate = {
    config,
};

Object.keys(config.tasks).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(config.tasks, key)) {
        if (fs.existsSync(`./gulp-tasks/${key}.js`)) {
            gulp.task(key, require(`./gulp-tasks/${key}`));
        }
    }
});

/**
 * Clean build directory
 */
gulp.task('clean', () => del(cleanFolderList, { cwd: config.destinationRoot }));

/**
 * Build app from sources
 */
gulp.task('build', ['clean'], () => runSequence(taskList));

// BrowserSync
gulp.task('browser-sync', () => {
    browserSync.init({
        proxy: config.vhost,
    });
});

/**
 * Watch task for development
 */
/* eslint-disable func-names */
gulp.task('watch', ['build'], () => {
    watchTaskList.forEach((task) => {
        const watchTask = task;
        watch(config.tasks[watchTask].source, { cwd: config.sourceRoot }, (function (t) {
            return function () {
                return runSequence([t]);
            };
        }(watchTask)));
    });
});
/* eslint-enable func-names */

gulp.watch(config.tasks.views.source).on('change', browserSync.reload);

gulp.task('serve', ['build', 'watch', 'browser-sync']);
gulp.task('default', ['build'], () => { });
