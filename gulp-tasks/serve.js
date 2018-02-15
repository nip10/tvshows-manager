const browserSync = require('browser-sync');
const util = require('gulp-util');

const { config } = util.env.boilerplate;

let browserSyncConfig;

if (Object.prototype.hasOwnProperty.call(config, 'vhost')) {
  browserSyncConfig = {
    proxy: config.vhost,
  };
} else {
  browserSyncConfig = {
    server: {
      baseDir: config.destinationRoot,
    },
  };
}

module.exports = function() {
  return browserSync.init(browserSyncConfig);
};
