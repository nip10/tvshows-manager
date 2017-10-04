import passport from 'passport';
import knex from '../db/connection';
import authUtil from './utils';

const LocalStrategy = require('passport-local').Strategy;

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    knex('users').where({ id }).first()
        .then(user => done(null, user.id))
        .catch(err => done(err, null));
});

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.

const options = {
    usernameField: 'email',
    passwordField: 'password',
};

passport.use(new LocalStrategy(options, (email, password, done) =>
    // check to see if the email exists
    knex('users').where({ email }).first()
        .then((user) => {
            if (!user) return done(null, false);
            // check if password's match
            if (!authUtil.comparePass(password, user.password)) {
                return done(null, false);
            }
            return done(null, user);
        })
        .catch(err => done(err))));

module.exports = passport;
