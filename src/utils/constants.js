/* eslint-disable no-template-curly-in-string */
import _ from 'lodash';

export const ERROR = {
  SERVER: 'Ooops. Something went wrong. Please try again.',
  AUTH: {
    PASSWORD_LEN: 'Password must be 8-30 characters',
    PASSWORD_MATCH: "Passwords don't match.",
    PASSWORD_INVALID: 'Invalid password.',
    INVALID_ID: 'Invalid user id',
    INVALID_EMAIL: 'Invalid email address',
    EMAIL_MATCH: "Email addresses don't match",
    EMAIL_EXISTS: 'Email address already registred.',
    REQUIRED: 'You need to login first.',
    RECAPTCHA: 'You need to complete the captcha.',
    INVALID_TOKEN: 'Invalid token.',
    ALREADY_AUTHENTICATED: 'You are already authenticated.',
    NOT_ACTIVATED: 'You need to activate your account first.',
    INVALID_CREDENTIALS: 'Invalid credentials',
  },
  BUG: {
    DESCRIPTION: 'Please fill in the bug description. Only alphanumerical characters are allowed.',
  },
  TVSHOW: {
    ALREADY_FOLLOWING: 'You are already following this tvshow.',
    NOT_FOLLOWING: 'You are not following this tvshow.',
    INVALID_NAME: 'Invalid tvshow name.',
    INVALID_SEASON: 'Invalid tvshow season.',
    INVALID_ID: 'Invalid tvshow id.',
    INVALID_ACTION: 'Invalid action.',
    NOT_FOUND: 'Tvshow not found.',
  },
  EPISODE: {
    ALREADY_WATCHED: 'You already set this episode as watched.',
    ALREADY_UNWATCHED: 'You already set this episode as unwatched.',
    NOT_FOUND: 'Episode not found.',
    INVALID_ID: 'Invalid episode id.',
    INVALID_ACTION: 'Invalid action',
  },
};

export const API = {
  THETVDB: {
    AUTH_LOGIN: 'https://api.thetvdb.com/login',
    SEARCH: 'https://api.thetvdb.com/search/series',
    INFO: _.template('https://api.thetvdb.com/series/${tvshowId}/filter'),
    IMAGES: _.template('https://api.thetvdb.com/series/${tvshowId}/images/query'),
    EPISODES_QUERY: _.template('https://api.thetvdb.com/series/${tvshowId}/episodes/query'),
    SEASON: _.template('https://api.thetvdb.com/series/${tvshowId}/episodes/summary'),
  },
  OMDB: {
    IMDB_RATING: _.template('http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}'),
  },
};
