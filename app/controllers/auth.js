import uuidv4 from 'uuid/v4';
import moment from 'moment';
import validator from 'validator';
import rp from 'request-promise';
import User from '../models/user';

const { RECAPTCHA_SECRET } = process.env;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RESET_PASSWORD_TOKEN_EXPIRATION = 15; // in minutes

/**
 * Authentication controller - All functions related to authentication (login/register/reset)
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
     * Validate login inputs
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    validateLogin(req, res, next) {
        const { email, password } = req.body;
        if (!email || !validator.isEmail(email)) {
            return res.status(422).json({ error: 'Invalid email address.' });
        } else if (!password || password.length < 8 || password.length > 30) {
            return res.status(422).json({ error: 'Password must be 8-30 chars.' });
        }
        return next();
    },
    /**
     * Validate register inputs
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    validateRegister(req, res, next) {
        const { email, password, passwordDuplicate } = req.body;
        if (!email || !validator.isEmail(email)) {
            return res.status(422).json({ error: 'Invalid email address.' });
        } else if (!password || password.length < 8 || password.length > 30) {
            return res.status(422).json({ error: 'Password must be 8-30 chars.' });
        } else if (!password || password !== passwordDuplicate) {
            return res.status(422).json({ error: 'Passwords don\'t match.' });
        }
        return next();
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
     * Validate email input
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    validateEmail(req, res, next) {
        const { email, emailDuplicate } = req.body;
        if (!email
            || !validator.isEmail(email)
            || !emailDuplicate
            || !validator.isEmail(emailDuplicate)) {
            return res.status(422).json({ error: 'Invalid email address.' });
        } else if (email !== emailDuplicate) {
            return res.status(422).json({ error: 'Email addresses don\'t match.' });
        }
        return next();
    },
    /**
     * Validate email input in url
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    validateEmailInUrl(req, res, next) {
        const { email } = req.params;
        if (!email || !validator.isEmail(email)) {
            return res.status(400).render('error', {
                message: 'Invalid email address',
            });
        }
        return next();
    },
    /**
     * Validate password input
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    validatePassword(req, res, next) {
        const { password, passwordDuplicate } = req.body;
        if (!password || password.length < 8 || password.length > 30) {
            return res.status(422).json({ error: 'Password must be 8-30 chars.' });
        } else if (!password || password !== passwordDuplicate) {
            return res.status(422).json({ error: 'Passwords don\'t match.' });
        }
        return next();
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
        try {
            const userExists = await User.checkIfUserExistsByEmail(email);
            if (!userExists) {
                return res.status(400).json({ error: 'Invalid email address.' });
            }
            const reset = {
                token: uuidv4(),
                expiration: moment().add(RESET_PASSWORD_TOKEN_EXPIRATION, 'minutes').toISOString(),
            };
            const addToken = await User.addTokenToUser(email, reset);
            if (!addToken) {
                throw new Error();
            }
            console.log(`New token generated for ${email}: ${reset.token}. Expires at: ${reset.expiration}`);
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
        try {
            const isTokenValid = await User.checkIfTokenIsValid(email, token);
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
        try {
            const isTokenValid = await User.checkIfTokenIsValid(email, token);
            if (!isTokenValid) {
                return res.status(422).json({ error: 'Invalid token. Please request a new token.' });
            }
            const changedPassword = await User.changePassword(email, password);
            if (!changedPassword) {
                throw new Error();
            }
            return res.json({ message: 'Password changed successfully.' });
        } catch (e) {
            return res.status(500).json({ error: 'Oooops. Something went wrong.' });
        }
    },
};

module.exports = authController;
