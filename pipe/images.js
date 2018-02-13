const lazypipe = require('lazypipe');
const imagemin = require('gulp-imagemin');
const gulpIf = require('gulp-if');
const util = require('gulp-util');

const { config } = util.env.boilerplate;
const imagesConfig = config.tasks.images;

module.exports = lazypipe().pipe(() => gulpIf(imagesConfig.minify, imagemin()));
