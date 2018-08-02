module.exports = function() {
  const config = require('./../gulp-config');

  const gulp = require('gulp');

  const envConfig = config.tasks.env;

  return gulp
    .src(envConfig.source, { cwd: config.root })
    .pipe(gulp.dest(config.destinationRoot))
    .on('error', function() {
      this.emit('error', new Error('Error copying fonts'));
    });
};
