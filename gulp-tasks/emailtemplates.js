module.exports = function() {
  const config = require('./../gulp-config');

  const gulp = require('gulp');

  const emailTemplatesConfig = config.tasks.emailTemplates;

  return gulp
    .src(emailTemplatesConfig.source, { cwd: config.sourceRoot })
    .pipe(gulp.dest(config.destinationRoot + emailTemplatesConfig.destination))
    .on('error', function() {
      this.emit('error', new Error('Error copying manifest'));
    });
};
