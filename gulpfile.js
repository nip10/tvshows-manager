const browserSync = require('browser-sync');
const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const watch = require('gulp-watch');
const path = require('path');

const config = require('./gulp-config');

const buildProdTaskList = [];
const buildDevTaskList = [];
const watchTaskList = [];

// Exit if the config file is not present
if (!config) {
  console.error('No config file provided. Make sure you have gulp-config.js in the root of your project.');
  process.exit(1);
}

// Get all tasks from the config file
Object.keys(config.tasks).forEach(taskName => {
  // Check if the task has a name
  if (Object.prototype.hasOwnProperty.call(config.tasks, taskName)) {
    // Check if the task file exists
    if (fs.existsSync(path.join(__dirname, 'gulp-tasks', `${taskName.toLowerCase()}.js`))) {
      // Import the task file
      gulp.task(taskName, require(path.join(__dirname, 'gulp-tasks', `${taskName.toLowerCase()}.js`)));
    }
    const task = config.tasks[taskName];
    buildProdTaskList.push(taskName);
    // Check whether the task is to 'watch', 'buildPord', or 'buildDev'
    if (Object.prototype.hasOwnProperty.call(task, 'watch')) {
      // The 'watching' of scripts is done inside the scripts task
      if (taskName !== 'scripts') {
        watchTaskList.push({ task: taskName, fileList: task.source });
      }
    }
    if (Object.prototype.hasOwnProperty.call(task, 'buildDev')) {
      buildDevTaskList.push(taskName);
    }
  }
});

// Clean build directory
gulp.task('clean', () => del('./dist'));

// Build app from sources for dev
// Waits for the 'clean' task to finish before starting
gulp.task('buildDev', ['clean'], cb => runSequence(buildDevTaskList, cb));

// Build app from sources for prod
// Waits for the 'clean' task to finish before starting
gulp.task('buildProd', ['clean'], cb => runSequence(buildProdTaskList, cb));

// BrowserSync
// Waits for the 'build' task to finish before starting
gulp.task('browser-sync', ['buildDev'], () => {
  browserSync.init({
    proxy: config.vhost,
  });
});

// Watch task for development
// Waits for the 'build' task to finish before starting
gulp.task('watch', ['buildDev'], () => {
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

gulp.task('serve', () => runSequence(['watch', 'browser-sync']));
gulp.task('default', ['buildProd']);
