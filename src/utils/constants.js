const CONSTANTS = {};

CONSTANTS.ERROR = {
  SERVER: 'Ooops. Something went wrong. Please try again.',
  AUTH: {
    PASSWORD_LEN: 'Password must be 8-30 characters',
    PASSWORD_MATCH: "Passwords don't match.",
    PASSWORD_INVALID: 'Invalid password.',
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
    INVALID: 'Invalid tvshow name.',
    NOT_FOUND: 'Tvshow not found.',
  },
  EPISODE: {
    ALREADY_WATCHED: 'You already set this episode as watched.',
    ALREADY_UNWATCHED: 'You already set this episode as unwatched.',
  },
};

module.exports = CONSTANTS;
