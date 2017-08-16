import path from 'path';
import morgan from 'morgan';
import pug from 'pug';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
// import favicon from 'serve-favicon';
import express from 'express';

import index from './routes/index';
import calendar from './routes/calendar';

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SECRET_KEY_SESSION,
  saveUninitialized: true, // saved new sessions
  resave: false, // do not automatically write to the session store
  // store: sessionStore,
  cookie: { httpOnly: false, maxAge: 2419200000 }, // configure when sessions expires, httpOnly should be true in production
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '../public')));
// app.use(favicon(__dirname + '/public/favicon.ico'));

app.use('/', index);
app.use('/calendar', calendar);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: (app.get('env') === 'development') ? err : {},
  });
});

module.exports = app;
