const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');

const hashPassword = password => {
    const salt = bcrypt.genSaltSync();
    return bcrypt.hashSync(password, salt);
};

exports.seed = function(knex, Promise) {
    return knex('users')
        .del()
        .then(() =>
            knex('users').insert({
                username: 'warrior',
                email: 'warrior@mail.com',
                password: hashPassword('warrior123'),
                activationtoken: uuidv4(),
                active: true,
                admin: true,
            }))
        .then(() =>
            knex('users').insert({
                username: 'foobar',
                email: 'foobar@mail.com',
                password: hashPassword('foobar123'),
                activationtoken: uuidv4(),
                active: true,
            }))
        .then(() =>
            knex('users').insert({
                username: 'theone',
                email: 'theone@mail.com',
                password: hashPassword('theone123'),
                activationtoken: uuidv4(),
                active: true,
            }));
};
