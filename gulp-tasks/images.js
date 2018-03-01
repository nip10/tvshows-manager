module.exports = function() {
  const gulp = require('gulp');
  const imagemin = require('gulp-imagemin');

  const util = require('gulp-util');

  const { config } = util.env.boilerplate;
  const imagesConfig = config.tasks.images;

  return gulp
    .src(imagesConfig.source, { cwd: config.sourceRoot })
    .pipe(imagemin({ verbose: true }))
    .pipe(gulp.dest(config.destinationRoot + imagesConfig.destination));
};
