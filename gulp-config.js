module.exports = {
  vhost: 'http://localhost:3002/tsm',
  sourceRoot: './src/',
  destinationRoot: './dist/',
  tasks: {
    sass: {
      source: ['public/sass/**/*.scss'],
      destination: 'public/css',
      config: {
        includePaths: [],
      },
      watch: true,
      buildDev: true,
    },
    sasslint: {
      source: ['public/sass/**/*.scss', '!public/sass/vendor/**/*.scss'],
      ignore: ['sass/vendor/**/*.scss'],
    },
    scripts: {
      source: ['public/js/app.js'],
      destination: 'public/js',
      destinationFile: 'app.js',
      babelConfig: {
        presets: [['@babel/env']],
        plugins: ['@babel/plugin-proposal-object-rest-spread'],
      },
      watch: true,
      buildDev: true,
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
      watch: true,
      buildDev: true,
    },
    views: {
      source: ['views/**/*.pug'],
      destination: 'views',
      watch: true,
      buildDev: true,
    },
    fonts: {
      source: ['public/fonts/*'],
      destination: 'public/fonts',
      watch: true,
      buildDev: true,
    },
    manifest: {
      source: ['public/manifest.json'],
      destination: 'public',
      buildDev: true,
    },
    env: {
      source: ['.env'],
      buildDev: true,
    },
  },
};
