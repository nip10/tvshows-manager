module.exports = function() {
  const config = require('./../gulp-config');

  const babelify = require('babelify'); // eslint-disable-line no-unused-vars
  const browserSync = require('browser-sync');
  const browserify = require('browserify');
  const buffer = require('vinyl-buffer');
  const gulp = require('gulp');
  const gulpif = require('gulp-if');
  const notify = require('gulp-notify');
  const source = require('vinyl-source-stream');
  const uglify = require('gulp-uglify');
  const watchify = require('watchify');

  const scriptConfig = config.tasks.scripts;

  const isProd = process.env.NODE_ENV === 'production';
  const isWatching = ['serve', 'watch'].indexOf(process.argv[2]) >= 0;

  // Error notifications
  const handleError = function(task) {
    return function(err) {
      notify.onError({
        message: `${task} failed, check the logs..`,
      })(err);
      console.error(err);
      this.emit('end');
    };
  };

  let bundler = browserify(scriptConfig.source, {
    basedir: config.sourceRoot,
    debug: isProd,
    cache: {},
    packageCache: {},
  }).transform('babelify', { presets: [scriptConfig.babelPresets] });

  if (isWatching) {
    bundler = watchify(bundler);
  }

  const bundle = function() {
    return bundler
      .bundle()
      .on('error', handleError('JS'))
      .pipe(source(scriptConfig.destinationFile))
      .pipe(buffer())
      .pipe(
        gulpif(
          isProd,
          uglify().on('error', err => {
            console.error(err);
          })
        )
      )
      .pipe(gulp.dest(config.destinationRoot + scriptConfig.destination))
      .pipe(gulpif(isWatching, browserSync.stream({ once: true })));
  };

  if (isWatching) {
    bundler.on('update', bundle);
  }

  return bundle();
};
