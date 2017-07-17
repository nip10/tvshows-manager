import passport from 'passport';
import init from './passport';
import knex from '../db/connection';
import authHelpers from './_helpers';

const LocalStrategy = require('passport-local').Strategy;

const options = {
  usernameField: 'email',
  passwordField: 'password',
};

init();

passport.use(new LocalStrategy(options, (email, password, done) => {
  // check to see if the email exists
  knex('users').where({ email }).first()
  .then((user) => {
    if (!user) return done(null, false); // return done(err)
    // check if password's match
    if (!authHelpers.comparePass(password, user.password)) {
      return done(null, false);
    }
    return done(null, user);
  })
  .catch(err => done(err));
}));

module.exports = passport;
