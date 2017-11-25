/* eslint-disable import/first */
require('dotenv').config();

import path from 'path';
import morgan from 'morgan';
import pug from 'pug'; // eslint-disable-line no-unused-vars
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
import favicon from 'serve-favicon';
import express from 'express';

import index from './routes/index';
import calendar from './routes/calendar';
import auth from './routes/auth';
import tvshows from './routes/tvshows';

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SECRET_KEY_SESSION,
    saveUninitialized: true,
    resave: false,
    cookie: { httpOnly: false, maxAge: 2419200000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '../dist')));
app.use(favicon(path.join(__dirname, '../dist/img/favicon.ico')));

app.use('/', index);
app.use('/auth', auth);
app.use('/tvshows', tvshows);
app.use('/calendar', calendar);

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res) => {
    console.log(err);
    res.status(err.status || 500);
    const dev = (process.env.NODE_ENV === 'development');
    res.render('error', {
        message: dev ? err.message : null,
        error: dev ? err : null,
    });
});

module.exports = app;
