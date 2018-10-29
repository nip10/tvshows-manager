const browserSync = require('browser-sync');
const config = require('./../gulp-config');

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
