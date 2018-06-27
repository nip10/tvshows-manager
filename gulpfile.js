const config = require('./gulp-config');

const browserSync = require('browser-sync');
const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const watch = require('gulp-watch');

const cleanFolderList = [];
const taskList = ['copyenv', 'copymailtemplates', 'copymanifest'];
const watchTaskList = [];

Object.keys(config.tasks).forEach(taskName => {
  if (Object.prototype.hasOwnProperty.call(config.tasks, taskName)) {
    if (fs.existsSync(`./gulp-tasks/${taskName}.js`)) {
      gulp.task(taskName, require(`./gulp-tasks/${taskName}`));
    }
    const task = config.tasks[taskName];
    taskList.push(taskName);
    if (
      Object.prototype.hasOwnProperty.call(task, 'destination') &&
      (!Object.prototype.hasOwnProperty.call(task, 'clean') || task.clean)
    ) {
      cleanFolderList.push(config.tasks[taskName].destination);
    }
    if (Object.prototype.hasOwnProperty.call(task, 'watch')) {
      watchTaskList.push({ task: taskName, fileList: task.watch });
    } else if (Object.prototype.hasOwnProperty.call(task, 'source')) {
      // 'scripts' task is bundled with babel, watch is managed in 'scripts' task
      if (taskName !== 'scripts') {
        watchTaskList.push({ task: taskName, fileList: task.source });
      }
    }
  }
});

// Clean build directory
gulp.task('clean', () => del('./dist'));

// Build app from sources
gulp.task('build', ['clean'], () => runSequence(taskList));

// BrowserSync
gulp.task('browser-sync', () => {
  browserSync.init({
    proxy: config.vhost,
  });
});

// Watch task for development
gulp.task('watch', ['build'], () => {
  Object.keys(watchTaskList).forEach(index => {
    const watchTask = watchTaskList[index];
    watch(
      watchTask.fileList,
      { cwd: config.sourceRoot },
      (function(task) {
        return function() {
          return runSequence([task]);
        };
      })(watchTask.task)
    );
  });
});

// Copy env file
gulp.task('copyenv', () => {
  gulp.src('.env', { base: '.' }).pipe(gulp.dest('dist/'));
});

// Copy mail/templates folder
gulp.task('copymailtemplates', () => {
  gulp
    .src('mail/templates/**/*.*', { cwd: config.sourceRoot })
    .pipe(gulp.dest(`${config.destinationRoot}mail/templates`));
});

// Copy PWA manifest
gulp.task('copymanifest', () => {
  gulp.src('public/manifest.json', { cwd: config.sourceRoot }).pipe(gulp.dest(`${config.destinationRoot}public`));
});

gulp.task('serve', ['build', 'watch', 'browser-sync']);
gulp.task('default', ['build']);
