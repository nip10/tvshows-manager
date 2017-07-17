const bcrypt = require('bcryptjs');

const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync();
  return bcrypt.hashSync(password, salt);
};

exports.seed = function (knex, Promise) {
  return knex('users').del()
    .then(() =>
       knex('users').insert({
         email: 'warrior@mail.com',
         password: hashPassword('warrior'),
       }))
       .then(() => knex('users').insert({
         email: 'king@mail.com',
         password: hashPassword('king123'),
       }))
       .then(() => knex('users').insert({
         email: 'theone@mail.com',
         password: hashPassword('theone'),
       }));
};
