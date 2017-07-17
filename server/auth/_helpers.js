import bcrypt from 'bcryptjs';

import knex from '../db/connection';

function comparePass(userPassword, databasePassword) {
  return bcrypt.compareSync(userPassword, databasePassword);
}

function createUser(req, res) {
  return handleErrors(req)
    .then(() => {
      const salt = bcrypt.genSaltSync();
      const hash = bcrypt.hashSync(req.body.password, salt);
      return knex('users')
        .insert({
          email: req.body.email,
          password: hash,
        })
        .returning('*');
    })
    .catch((err) => {
      res.status(400).json({ status: err.message });
    });
}

function loginRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ status: 'Please log in' });
  return next();
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  // if they aren't redirect them to the home page
  return res.redirect('/');
}

function adminRequired(req, res, next) {
  if (!req.user) res.status(401).json({ status: 'Please log in' });
  return knex('users').where({ email: req.user.email }).first()
  .then((user) => {
    if (!user.admin) res.status(401).json({ status: 'You are not authorized' });
    return next();
  })
  .catch((err) => {
    res.status(500).json({ status: 'Something bad happened' });
  });
}

function loginRedirect(req, res, next) {
  if (req.user) {
    return res.status(401).json(
    { status: 'You are already logged in' });
  }
  return next();
}

function handleErrors(req) {
  return new Promise((resolve, reject) => {
    if (req.body.email.length < 6) {
      reject({
        message: 'Email must be longer than 6 characters',
      });
    } else if (req.body.password.length < 6) {
      reject({
        message: 'Password must be longer than 6 characters',
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  comparePass,
  createUser,
  loginRequired,
  adminRequired,
  loginRedirect,
  isLoggedIn,
};
