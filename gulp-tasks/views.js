module.exports = function() {
  const gulp = require('gulp');
  const util = require('gulp-util');
  const browserSync = require('browser-sync');

  const { config } = util.env.boilerplate;
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
