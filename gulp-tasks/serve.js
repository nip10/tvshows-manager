const config = require('./../gulp-config');

const browserSync = require('browser-sync');

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
