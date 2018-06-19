module.exports = function() {
  const config = require('./../gulp-config');

  const eslint = require('gulp-eslint');
  const gulp = require('gulp');

  const eslintConfig = config.tasks.eslint;

  return gulp
    .src(eslintConfig.source, { cwd: config.sourceRoot })
    .pipe(eslint(eslintConfig.config || {}))
    .pipe(eslint.format());
};
