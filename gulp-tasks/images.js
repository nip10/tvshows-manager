module.exports = function() {
  const config = require('./../gulp-config');

  const gulp = require('gulp');
  const imagemin = require('gulp-imagemin');

  const imagesConfig = config.tasks.images;

  return gulp
    .src(imagesConfig.source, { cwd: config.sourceRoot })
    .pipe(imagemin({ verbose: true }))
    .pipe(gulp.dest(config.destinationRoot + imagesConfig.destination));
};
