module.exports = function() {
  const config = require('./../gulp-config');

  const gulp = require('gulp');
  const notify = require('gulp-notify');
  const plumber = require('gulp-plumber');
  const sassLint = require('gulp-sass-lint');

  const sasslintConfig = config.tasks.sasslint;

  const options = {};
  if (sasslintConfig.ignore) {
    options.files = { ignore: sasslintConfig.ignore };
  }

  return gulp
    .src(sasslintConfig.source, { cwd: config.sourceRoot })
    .pipe(
      plumber({
        errorHandler: notify.onError({
          message: '<%= error.message %>',
          title: 'Sass lint Error',
        }),
      })
    )
    .pipe(sassLint(options))
    .pipe(sassLint.format());
};
