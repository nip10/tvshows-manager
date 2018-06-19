module.exports = {
  vhost: 'http://localhost:3002/tsm',
  sourceRoot: './src/',
  destinationRoot: './dist/',
  tasks: {
    sass: {
      source: ['public/sass/**/*.scss'],
      destination: 'public/css',
      browsers: ['last 2 versions'],
      config: {
        includePaths: [],
      },
    },
    sasslint: {
      source: ['public/sass/**/*.scss', '!public/sass/vendor/**/*.scss'],
      ignore: ['sass/vendor/**/*.scss'],
    },
    scripts: {
      source: ['public/js/app.js'],
      destination: 'public/js',
      destinationFile: 'app.js',
      babelPresets: 'env',
    },
    eslint: {
      source: ['public/js/**/*.js'],
      config: {
        configFile: '.eslintrc.json',
      },
    },
    images: {
      source: ['public/img/**/*'],
      destination: 'public/img',
      minify: true,
    },
    views: {
      source: ['views/**/*.pug'],
      destination: 'views',
    },
  },
};
