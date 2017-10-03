module.exports = function () {
    const gulp = require('gulp');
    const plumber = require('gulp-plumber');
    const notify = require('gulp-notify');
    const sassLint = require('gulp-sass-lint');
    const util = require('gulp-util');

    const { config } = util.env.boilerplate;
    const sasslintConfig = config.tasks.sasslint;

    const options = {};
    if (sasslintConfig.ignore) {
        options.files = { ignore: sasslintConfig.ignore };
    }

    return gulp.src([`./src/${sasslintConfig.source}`, '!./src/sass/vendor/**/*.scss'])
        .pipe(plumber({
            errorHandler: notify.onError({
                message: '<%= error.message %>',
                title: 'Sass lint Error',
            }),
        }))
        .pipe(sassLint(options))
        .pipe(sassLint.format());
};
