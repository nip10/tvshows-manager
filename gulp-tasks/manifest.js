module.exports = function() {
  const config = require('./../gulp-config');

  const gulp = require('gulp');

  const manifestConfig = config.tasks.manifest;

  return gulp
    .src(manifestConfig.source, { cwd: config.sourceRoot })
    .pipe(gulp.dest(config.destinationRoot + manifestConfig.destination))
    .on('error', function() {
      this.emit('error', new Error('Error copying manifest'));
    });
};
