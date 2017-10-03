import bcrypt from 'bcryptjs';

import knex from '../db/connection';

module.exports = {
    comparePass: (userPassword, dbPassword) => bcrypt.compareSync(userPassword, dbPassword),
    isLoggedIn: (req, res, next) => {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated()) {
            return next();
        }
        // if they aren't redirect them to the home page
        return res.redirect('/');
    },
    createUser: (req, res) => {
        const salt = bcrypt.genSaltSync();
        const hash = bcrypt.hashSync(req.body.password, salt);
        return knex('users')
            .insert({
                email: req.body.email,
                password: hash,
            })
            .returning('*');
    },
};
