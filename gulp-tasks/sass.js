module.exports = function() {
  const config = require('./../gulp-config');

  const autoprefixer = require('autoprefixer');
  const browserSync = require('browser-sync');
  const cssnano = require('cssnano');
  const gulp = require('gulp');
  const gulpif = require('gulp-if');
  const notify = require('gulp-notify');
  const plumber = require('gulp-plumber');
  const postcss = require('gulp-postcss');
  const sass = require('gulp-sass');
  const sourcemaps = require('gulp-sourcemaps');

  const sassConfig = config.tasks.sass;
  const isProd = process.env.NODE_ENV === 'production';
  const isWatching = ['serve', 'watch'].indexOf(process.argv[2]) >= 0;
  const plugins = [autoprefixer(), cssnano()];

  return gulp
    .src(sassConfig.source, { cwd: config.sourceRoot })
    .pipe(
      plumber({
        errorHandler: notify.onError({
          message: '<%= error.message %>',
          title: 'SASS Error',
        }),
      })
    )
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(
      sass(),
      sassConfig.config
    )
    .pipe(postcss(plugins))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(gulp.dest(config.destinationRoot + sassConfig.destination))
    .pipe(gulpif(isWatching, browserSync.stream()))
    .on('error', function() {
      this.emit('error', new Error('SASS compilation Error'));
    });
};
