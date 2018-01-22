import uuidv4 from 'uuid/v4';
import moment from 'moment';
import validator from 'validator';
import rp from 'request-promise';
import _ from 'lodash';
import passport from '../auth/local';
import User from '../models/user';

const { RECAPTCHA_SECRET } = process.env;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RESET_PASSWORD_TOKEN_EXPIRATION = 15; // in minutes

/**
 * Authentication controller - All functions related to authentication (login/signup/reset)
 * @module controllers/auth
 */

const authController = {
    /**
     * Check if a user is logged-in
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        return res.status(401).json({ error: 'Please login/signup first.' });
    },
    /**
     * Check if a user is logged-in
     * If not, set error message in a cookie and redirect to the homepage
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    isLoggedInWithMessage(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        // set error message in cookie to be displayed on a toastr notification
        res.cookie('message', 'You need to be authenticated.');
        return res.redirect('/');
    },
    /**
     * Validate recaptcha
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    async validateRecaptcha(req, res, next) {
        const { recaptcha } = req.body;
        if (!recaptcha) {
            return res.status(401).json({ error: 'You need complete the recaptcha.' });
        }
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const requestOptions = {
            method: 'POST',
            uri: RECAPTCHA_VERIFY_URL,
            qs: {
                secret: RECAPTCHA_SECRET,
                response: recaptcha,
                ip: clientIp,
            },
            json: true,
        };
        try {
            const data = await rp(requestOptions);
            if (!data.success) {
                throw new Error();
            }
            return next();
        } catch (e) {
            return res.status(400).json({ error: 'Invalid captcha. Please try again.' });
        }
    },
    /**
     * Logout
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    logout(req, res) {
        req.logout();
        // logout() is not enough, so I use session.destroy()
        // the redirect is done in the callback to make sure
        // the session is destroyed before the redirect
        req.session.destroy((err) => {
            console.log(err);
            return res.redirect('/');
        });
    },
    /**
     * Request password reset
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async resetPasswordRequest(req, res) {
        const { email } = req.body;
        const normalizedEmail = validator.normalizeEmail(email);
        if (!normalizedEmail || validator.isEmail(normalizedEmail)) {
            return res.status(422).json({ error: 'Invalid email address.' });
        }
        try {
            const userExists = await User.checkIfUserExistsByEmail(normalizedEmail);
            if (!userExists) {
                return res.status(400).json({ error: 'Invalid email address.' });
            }
            const reset = {
                token: uuidv4(),
                expiration: moment().add(RESET_PASSWORD_TOKEN_EXPIRATION, 'minutes').toISOString(),
            };
            const addToken = await User.addTokenToUser(normalizedEmail, reset);
            if (!addToken) {
                throw new Error();
            }
            console.log(`New token generated for ${normalizedEmail}: ${reset.token}. Expires at: ${reset.expiration}`);
        } catch (e) {
            return res.status(500).json({ error: 'Oooops. Something went wrong.' });
        }
        // TODO: Send email here
        return res.json({ message: 'An email has been sent to your email address.' });
    },
    /**
     * Request password reset with token
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async resetPasswordWithToken(req, res) {
        const { email, token } = req.params;
        const normalizedEmail = validator.normalizeEmail(email);
        if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
            return res.status(400).render('error', {
                message: 'Invalid email address.',
            });
        }
        if (!token) {
            return res.status(400).render('error', {
                message: 'Invalid token.',
            });
        }
        try {
            const isTokenValid = await User.checkIfTokenIsValid(normalizedEmail, token);
            if (!isTokenValid) {
                return res.status(400).render('error', {
                    message: 'Token is not valid or has already expired.',
                });
            }
            return res.render('index', {
                title: 'Tv-shows Manager',
                resetPassword: true,
            });
        } catch (e) {
            console.log(e);
            return res.status(500).render('error', {
                message: 'Oooops. Something went wrong.',
            });
        }
    },
    /**
     * Reset password
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async resetPassword(req, res) {
        const { password } = req.body;
        const { email, token } = req.params;
        const normalizedEmail = validator.normalizeEmail(email);
        if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
            return res.status(422).json({ error: 'Invalid email address.' });
        }
        if (!token) {
            return res.status(422).json({ error: 'Invalid token.' });
        }
        if (!password || password.length < 8 || password.length > 30) {
            return res.status(422).json({ error: 'Password must be 8-30 chars.' });
        }
        try {
            const isTokenValid = await User.checkIfTokenIsValid(normalizedEmail, token);
            if (!isTokenValid) {
                return res.status(422).json({ error: 'Invalid token. Please request a new token.' });
            }
            const changedPassword = await User.changePassword(normalizedEmail, password);
            if (!changedPassword) {
                throw new Error();
            }
            return res.json({ message: 'Password changed successfully.' });
        } catch (e) {
            return res.status(500).json({ error: 'Oooops. Something went wrong.' });
        }
    },
    login(req, res, next) {
        if (req.isAuthenticated()) {
            return res.status(400).json({ error: 'You are already logged in.' });
        }
        const { email, password } = req.body;
        const validateLogin = User.validateLogin(email, password);
        if (!_.isNil(validateLogin.error)) {
            return res.status(422).json({ error: validateLogin.error });
        }
        return passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);
            if (!user) {
                return res.status(422).json({ error: info.message });
            }
            return req.logIn(user, (err2) => {
                if (err) return next(err2);
                return res.redirect(req.session.returnTo || '/calendar');
            });
        })(req, res, next);
    },
    async signup(req, res, next) {
        if (req.isAuthenticated()) {
            return res.status(400).json({ error: 'You are already logged in.' });
        }
        const { email, password, passwordDuplicate } = req.body;
        const validateSignup = User.validateSignup(email, password, passwordDuplicate);
        if (!_.isNil(validateSignup.error)) {
            return res.status(422).json({ error: validateSignup.error });
        }
        try {
            const user = await User.createUser(validateSignup.normalizedEmail, password);
            if (user) {
                return req.logIn(user, (err) => {
                    if (err) return next(err);
                    return req.session.save(() => res.redirect('/calendar'));
                });
            }
            return res.status(422).json({ error: 'Email already registred.' });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: 'Oooops. Something went wrong.' });
        }
    },
};

module.exports = authController;
