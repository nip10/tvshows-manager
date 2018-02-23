import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { comparePassword } from '../models/user';
import knex from '../db/connection';
import { ERROR } from '../utils/constants';

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

const options = {
  usernameField: 'email',
  passwordField: 'password',
};

passport.use(
  new LocalStrategy(options, async (email, password, done) => {
    try {
      const user = await knex('users')
        .where({ email })
        .first();
      if (!user) return done(null, false, { message: ERROR.AUTH.INVALID_CREDENTIALS });
      const result = await comparePassword(password, user.password);
      if (!result) return done(null, false, { message: ERROR.AUTH.INVALID_CREDENTIALS });
      return done(null, user);
    } catch (e) {
      return done(e);
    }
  })
);

module.exports = passport;
