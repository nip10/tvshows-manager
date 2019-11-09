module.exports = function() {
  const config = require('./../gulp-config');

  const browserSync = require('browser-sync');
  const gulp = require('gulp');

  const viewsConfig = config.tasks.views;

  const isWatching = ['serve', 'watch'].indexOf(process.argv[2]) >= 0;

  if (isWatching) {
    return browserSync.reload();
  }

  return gulp
    .src(viewsConfig.source, { cwd: config.sourceRoot })
    .pipe(gulp.dest(config.destinationRoot + viewsConfig.destination))
    .on('error', function() {
      this.emit('error', new Error('Error copying views'));
    });
};
