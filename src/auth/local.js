import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import validator from 'validator';
import uuidv4 from 'uuid/v4';
import _ from 'lodash';
import knex from '../db/connection';
import { ERROR } from '../utils/constants';
import User from '../models/user';

const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = process.env;

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session. The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    // TODO: Move this to the User model
    const user = await knex('users')
      .where({ id })
      .first();
    return done(null, user.id);
  } catch (e) {
    return done(e, null);
  }
});

// Configure the local strategy for use by Passport.
//
// The local strategy require a 'verify' function which receives the credentials
// ('username' and 'password') submitted by the user.  The function must verify
// that the password is correct and then invoke 'cb' with a user object, which
// will be set at 'req.user' in route handlers after authentication.

const localOptions = {
  usernameField: 'email',
  passwordField: 'password',
};

passport.use(
  new LocalStrategy(localOptions, async (email, password, done) => {
    try {
      const user = User.getUserByEmail(email);
      // If the user doesnt exist, we dont want to send that information to the client,
      // just send a generic error message
      if (!user) return done(null, false, { message: ERROR.AUTH.INVALID_CREDENTIALS });
      const passwordsMatch = await User.comparePassword(password, user.password);
      if (!passwordsMatch) return done(null, false, { message: ERROR.AUTH.INVALID_CREDENTIALS });
      return done(null, user);
    } catch (e) {
      return done(e);
    }
  })
);

// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.

const fbOptions = {
  clientID: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  callbackURL: 'https://1de4f13b.ngrok.io/tsm/auth/login/fb/cb',
  enableProof: true,
  profileFields: ['id', 'displayName', 'email'],
};

passport.use(
  new FacebookStrategy(fbOptions, async (accessToken, refreshToken, profile, done) => {
    const fbId = Number.parseInt(profile.id, 10);
    if (!_.isFinite(fbId)) return done(null, false, 'Invalid facebook id');
    try {
      const hasEmail = _.get(profile, 'emails');
      let email = null;
      if (hasEmail) {
        email = _.head(hasEmail).value;
      } else {
        return done(null, false, "Your facebook account doesn't have a valid email address");
      }
      if (!validator.isEmail(email)) {
        return done(null, false, ERROR.AUTH.INVALID_EMAIL);
      }
      const normalizedEmail = validator.normalizeEmail(email);
      const userId = await User.getUserIdByEmail(normalizedEmail);
      if (!_.isFinite(userId)) {
        const username = profile.displayName.split(' ')[0];
        const activateAccountToken = uuidv4();
        const newUserId = await User.createFbUser(username, normalizedEmail, fbId, activateAccountToken);
        return done(null, { id: newUserId });
      }
      return done(null, { id: userId });
    } catch (e) {
      return done(e);
    }
  })
);

module.exports = passport;
