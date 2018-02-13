const lazypipe = require('lazypipe');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const cleanCss = require('gulp-clean-css');
const gulpif = require('gulp-if');
const util = require('gulp-util');

const { config } = util.env.boilerplate;
const sassConfig = config.tasks.sass;

module.exports = lazypipe()
    .pipe(() => gulpif(!util.env.production, sourcemaps.init()))
    .pipe(sass, sassConfig.config)
    .pipe(autoprefixer, { browsers: sassConfig.browsers })
    .pipe(() => gulpif(util.env.production, cleanCss()))
    .pipe(() => gulpif(!util.env.production, sourcemaps.write()));
