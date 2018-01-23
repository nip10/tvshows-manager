import dotenv from 'dotenv';
import path from 'path';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
import favicon from 'serve-favicon';
import express from 'express';
import helmet from 'helmet';

import index from './routes/index';
import calendar from './routes/calendar';
import auth from './routes/auth';
import tvshows from './routes/tvshow';

// Load environment variables
dotenv.config({ path: '../.env' });

// Create Express server
const app = express();

// Express configuration
app.use(helmet());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SECRET_KEY_SESSION,
    saveUninitialized: true,
    resave: true,
    cookie: { httpOnly: false, maxAge: 2419200000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '../dist')));
app.use(favicon(path.join(__dirname, '../dist/img/favicon.ico')));

// Routes
app.use('/', index);
app.use('/auth', auth);
app.use('/tvshows', tvshows);
app.use('/calendar', calendar);

// Handle 404
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    res.render('404');
});

// Handle server errors
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.log(err);
    const dev = (process.env.NODE_ENV === 'development');
    return res.render('error', {
        error: dev ? err : null,
    });
});

module.exports = app;
