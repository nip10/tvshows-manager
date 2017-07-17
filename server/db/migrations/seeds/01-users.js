const bcrypt = require('bcryptjs');

const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync();
  return bcrypt.hashSync(password, salt);
};

exports.seed = function (knex, Promise) {
  return knex('users').del()
    .then(() =>
       knex('users').insert({
         username: 'warrior',
         email: 'warrior@mail.com',
         password: hashPassword('warrior'),
         language: 'pt',
       }))
       .then(() => knex('users').insert({
         username: 'king',
         email: 'king@mail.com',
         password: hashPassword('king123'),
         language: 'en',
       }))
       .then(() => knex('users').insert({
         username: 'theone',
         email: 'theone@mail.com',
         password: hashPassword('theone'),
         language: 'en',
       }));
};
