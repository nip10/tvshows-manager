const bcrypt = require('bcryptjs');

const hashPassword = password => bcrypt.hash(password, 10).then(hashedPassword => hashedPassword);

exports.seed = (knex, Promise) =>
  knex('users')
    .del()
    .then(() =>
      knex('users').insert({
        username: 'warrior',
        email: 'warrior@mail.com',
        password: hashPassword('warrior123'),
        active: true,
        admin: true,
      })
    )
    .then(() =>
      knex('users').insert({
        username: 'foobar',
        email: 'foobar@mail.com',
        password: hashPassword('foobar123'),
        active: true,
      })
    )
    .then(() =>
      knex('users').insert({
        username: 'theone',
        email: 'theone@mail.com',
        password: hashPassword('theone123'),
        active: true,
      })
    );
