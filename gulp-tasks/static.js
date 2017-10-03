module.exports = function () {
    const gulp = require('gulp');

    const util = require('gulp-util');

    const { config } = util.env.boilerplate;
    const staticConfig = config.tasks.static;

    return gulp.src(staticConfig.source, { cwd: config.sourceRoot })
        .pipe(gulp.dest(config.destinationRoot + staticConfig.destination));
};
