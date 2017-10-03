module.exports = function () {
    const gulp = require('gulp');
    const plumber = require('gulp-plumber');
    const notify = require('gulp-notify');
    const gulpif = require('gulp-if');
    const browserSync = require('browser-sync');
    const util = require('gulp-util');

    const { config } = util.env.boilerplate;
    const sassPipe = require('./sass-pipe');

    const sassConfig = config.tasks.sass;

    const isWatching = ['serve', 'watch'].indexOf(process.argv[2]) >= 0;

    return gulp.src(sassConfig.source, { cwd: config.sourceRoot })
        .pipe(plumber({
            errorHandler: notify.onError({
                message: '<%= error.message %>',
                title: 'SASS Error',
            }),
        }))
        .pipe(sassPipe())
        .pipe(gulp.dest(config.destinationRoot + sassConfig.destination))
        .pipe(gulpif(isWatching, browserSync.stream()))
        .on('error', function () {
            this.emit('error', new Error('SASS compilation Error'));
        });
};
