module.exports = function() {
  const config = require('./../gulp-config');

  const gulp = require('gulp');

  const fontsConfig = config.tasks.fonts;

  return gulp
    .src(fontsConfig.source, { cwd: config.sourceRoot })
    .pipe(gulp.dest(config.destinationRoot + fontsConfig.destination))
    .on('error', function() {
      this.emit('error', new Error('Error copying fonts'));
    });
};
