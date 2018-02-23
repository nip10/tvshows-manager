import dotenv from 'dotenv';
import path from 'path';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import ConnectRedis from 'connect-redis';
import passport from 'passport';
import favicon from 'serve-favicon';
import express from 'express';
import helmet from 'helmet';

import index from './routes/index';
import calendar from './routes/calendar';
import auth from './routes/auth';
import tvshows from './routes/tvshow';
import user from './routes/user';
import watchlist from './routes/watchlist';

// Load environment variables
dotenv.config();
const { NODE_ENV, SESSION_SECRET, REDIS_HOST, REDIS_PORT } = process.env;
const isDev = NODE_ENV === 'development';

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
// Configure session store (dev = local, prod = redis)
if (isDev) {
  app.use(
    session({
      secret: SESSION_SECRET,
      saveUninitialized: true,
      resave: true,
      cookie: { httpOnly: false, maxAge: 2419200000 },
    })
  );
} else {
  // Set trust (first) proxy since nodejs is running behind nginx
  app.set('trust proxy', 1);
  const RedisStore = new ConnectRedis(session);
  const redisOptions = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    logErrors: true,
  };
  app.use(
    session({
      store: new RedisStore(redisOptions),
      secret: SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      rolling: true,
      cookie: { httpOnly: false, secure: false, maxAge: 2419200000 },
      // cookie: { httpOnly: false, secure: true, maxAge: 2419200000 },
    })
  );
}
app.use(passport.initialize());
app.use(passport.session());
if (isDev) {
  app.use(express.static(path.join(__dirname, '..', 'dist', 'public')));
} else {
  // Using express static in prod for testing.
  // Remove this after setting up nginx
  app.use(express.static(path.join(__dirname, 'public')));
}
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));

// Routes
app.use('/', index);
app.use('/auth', auth);
app.use('/tvshows', tvshows);
app.use('/calendar', calendar);
app.use('/user', user);
app.use('/watchlist', watchlist);

// Handle 404 (dev = express, prod = nginx)
if (isDev) {
  app.use((req, res) => {
    const err = new Error('Not Found');
    err.status = 404;
    return res.status(404).render('error', {
      error: isDev ? err : null,
    });
  });
}

// Handle server errors
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.log(err);
  return res.status(500).render('error', {
    error: isDev ? err : null,
  });
});

module.exports = app;
