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
// Global variable that is passed to all renders,
// so that pug selects the right assets path
app.locals.dev = isDev;

/* *********************
  Express configuration
********************** */

// Security middleware
app.use(helmet());
// Logging
app.use(morgan(isDev ? 'dev' : 'combined'));
// View engine/assets path
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// Cookie/JSON parsers
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session store
// In prod, session store is Redis
if (isDev) {
  app.use(
    session({
      secret: SESSION_SECRET,
      saveUninitialized: true,
      resave: true,
      rolling: true,
      cookie: { httpOnly: false, secure: false, maxAge: 2419200000 },
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
    })
  );
}

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files/favicon handlers
// In prod, static files are handled by Nginx
if (isDev) {
  app.use(express.static(path.join(__dirname, '..', 'dist', 'public')));
}
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));

// Routes
app.use('/tsm/', index);
app.use('/tsm/auth', auth);
app.use('/tsm/tvshows', tvshows);
app.use('/tsm/calendar', calendar);
app.use('/tsm/user', user);
app.use('/tsm/watchlist', watchlist);

// Handle 404s
app.use((req, res) => {
  const err = new Error('Error: Page Not Found.');
  err.status = 404;
  return res.status(404).render('error', {
    error: err,
  });
});

// Handle server errors
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.log(err);
  return res.status(500).render('error', {
    error: isDev ? err : null,
  });
});

module.exports = app;
