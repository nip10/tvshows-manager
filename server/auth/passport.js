import passport from 'passport';
import knex from '../db/connection';

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    knex('users').where({ id }).first()
      .then(user => done(null, user.id))
      .catch(err => done(err, null));
  });
};
