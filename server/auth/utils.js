import bcrypt from 'bcryptjs';

import knex from '../db/connection';

module.exports = {
    comparePass: (userPassword, dbPassword) => bcrypt.compareSync(userPassword, dbPassword),
    isLoggedInWithRedirect: (req, res, next) => {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated()) {
            return next();
        }
        // if he isnt, redirect him to the home page
        return res.redirect('/');
    },
    isLoggedIn: (req, res, next) => {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated()) {
            return next();
        }
        // if he isnt, send not autorized
        return res.status(401).json({ error: 'Please login/signup first.' });
    },
    createUser: (req) => {
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
