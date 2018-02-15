module.exports = function() {
  const gulp = require('gulp');
  const util = require('gulp-util');

  const { config } = util.env.boilerplate;
  const viewsConfig = config.tasks.views;

  return gulp
    .src(viewsConfig.source, { cwd: config.sourceRoot })
    .pipe(gulp.dest(config.destinationRoot + viewsConfig.destination))
    .on('error', function() {
      this.emit('error', new Error('Error copying views'));
    });
};
