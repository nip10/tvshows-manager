import bcrypt from 'bcryptjs';
import validator from 'validator';
import rp from 'request-promise';
import genAvatar from '../utils/avatar';
import knex from '../db/connection';

module.exports = {
    comparePass: (userPassword, dbPassword) => bcrypt.compareSync(userPassword, dbPassword),
    isLoggedIn: (req, res, next) => {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated()) {
            return next();
        }
        // if he isnt, send not autorized
        return res.status(401).json({ error: 'Please login/signup first.' });
    },
    isLoggedInWithRedirect: (req, res, next) => {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated()) {
            return next();
        }
        // if he isnt, redirect him to the home page
        return res.redirect('/');
    },
    isLoggedInWithMessage: (req, res, next) => {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated()) {
            return next();
        }
        // set message in 'message' cookie
        res.cookie('message', 'You need to be authenticated!');
        // redirect to the homepage
        return res.redirect('/');
    },
    createUser: (req) => {
        const { email, password } = req.body;
        const salt = bcrypt.genSaltSync();
        const hashedPassword = bcrypt.hashSync(password, salt);
        const username = email.split('@')[0];
        const avatar = genAvatar();
        return knex('users').insert({ username, email, password: hashedPassword, avatar }).returning('*');
    },
    validateLogin: (req, res, next) => {
        const { email, password } = req.body;
        if (!email || !validator.isEmail(email)) {
            return res.status(422).json({ error: 'Invalid email address !' });
        } else if (!password || password.length < 8 || password.length > 30) {
            return res.status(422).json({ error: 'Password must be 8-30 chars !' });
        }
        return next();
    },
    validateRegister: (req, res, next) => {
        const { email, password, passwordDuplicate } = req.body;
        if (!email || !validator.isEmail(email)) {
            return res.status(422).json({ error: 'Invalid email address !' });
        } else if (!password || password.length < 8 || password.length > 30) {
            return res.status(422).json({ error: 'Password must be 8-30 chars !' });
        } else if (!password || password !== passwordDuplicate) {
            return res.status(422).json({ error: 'Passwords don\'t match !' });
        }
        return next();
    },
    validateRecaptcha: async (req, res, next) => {
        const { recaptcha } = req.body;
        if (!recaptcha) {
            return res.status(401).json({ error: 'You need complete the captcha.' });
        }
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const requestOptions = {
            method: 'POST',
            uri: 'https://www.google.com/recaptcha/api/siteverify',
            qs: {
                secret: '6LdypToUAAAAAKDFKKIYpU9m0AfZiSmVPnLd1XZN',
                response: recaptcha,
                ip: clientIp,
            },
            json: true,
        };
        try {
            const data = await rp(requestOptions);
            if (!data.success) {
                throw new Error('Invalid captcha response');
            }
            return next();
        } catch (e) {
            return res.status(400).json({ error: 'Invalid captcha. Please try again.' });
        }
    },
    validateEmail: (req, res, next) => {
        const { email, emailDuplicate } = req.body;
        if (!email || !validator.isEmail(email) || !emailDuplicate || !validator.isEmail(emailDuplicate)) {
            return res.status(422).json({ error: 'Invalid email address !' });
        } else if (email !== emailDuplicate) {
            return res.status(422).json({ error: 'Email addresses don\'t match !' });
        }
        return next();
    },
    validateEmailInUrl: (req, res, next) => {
        const { email } = req.params;
        if (!email || !validator.isEmail(email)) {
            res.render('error', {
                message: 'Invalid email address',
            });
        }
        return next();
    },
    validatePassword: (req, res, next) => {
        const { password, passwordDuplicate } = req.body;
        if (!password || password.length < 8 || password.length > 30) {
            return res.status(422).json({ error: 'Password must be 8-30 chars !' });
        } else if (!password || password !== passwordDuplicate) {
            return res.status(422).json({ error: 'Passwords don\'t match !' });
        }
        return next();
    },
    checkIfUserExistsByEmail: async (email) => {
        const inner = knex.select(1).from('users').where('email', email).limit(1);
        try {
            const emailExistsOnDb = await knex.raw(inner).wrap('select exists (', ')');
            return emailExistsOnDb.rows[0].exists;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    addTokenToUser: async (email, reset) => {
        try {
            const addToken = await knex('users').where({ email }).update({ resetpwtoken: reset.token, resetpwexp: reset.expiration });
            if (addToken !== 1) {
                throw new Error(`Adding token for user ${email} to the database failed.`);
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    checkIfTokenIsValid: async (email, token) => {
        const inner = knex.select(1).from('users').where({ email, resetpwtoken: token }).whereRaw("resetpwexp > current_timestamp - interval '15 minutes'").limit(1);
        try {
            const isTokenValid = await knex.raw(inner).wrap('select exists (', ')');
            return isTokenValid.rows[0].exists;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    changeUserPassword: async (email, password) => {
        const salt = bcrypt.genSaltSync();
        const hash = bcrypt.hashSync(password, salt);
        try {
            const changedPassword = await knex('users').where({ email }).update({ password: hash });
            if (changedPassword !== 1) {
                throw new Error(`Changing password for user ${email} failed`);
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
};
