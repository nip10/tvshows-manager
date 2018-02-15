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
    res.cookie('message_error', 'You need to be authenticated.');
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
      return res.status(500).json({ error: 'Ooops. Something went wrong... Please try again.' });
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
    // destroy callback has 'err' available in the callback
    req.session.destroy(() => res.redirect('/'));
  },
  /**
   * Request password reset
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async resetPasswordRequest(req, res) {
    const { email, emailDuplicate } = req.body;
    if (!email || validator.isEmail(email)) {
      return res.status(422).json({ error: 'Invalid email address.' });
    } else if (email !== emailDuplicate) {
      return res.status(422).json({ error: 'Email addresses don\t match.' });
    }
    const normalizedEmail = validator.normalizeEmail(email);
    try {
      const userExists = await User.checkIfUserExistsByEmail(normalizedEmail);
      if (!userExists) {
        return res.status(422).json({ error: 'Invalid email address.' });
      }
      const reset = {
        token: uuidv4(),
        expiration: moment()
          .add(RESET_PASSWORD_TOKEN_EXPIRATION, 'minutes')
          .toISOString(),
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
      return res.status(422).render('error', {
        message: 'Invalid email address.',
      });
    }
    if (!token) {
      return res.status(422).render('error', {
        message: 'Invalid token.',
      });
    }
    try {
      const isTokenValid = await User.checkIfTokenIsValid(normalizedEmail, token);
      if (!isTokenValid) {
        return res.status(422).render('error', {
          message: 'Token is not valid or has already expired.',
        });
      }
      return res.render('index', {
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
    const { password, passwordDuplicate } = req.body;
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
    if (password !== passwordDuplicate) {
      return res.status(422).json({ error: 'Passwords don\t match.' });
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
  /**
   * Login
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {undefined}
   */
  async login(req, res, next) {
    if (req.isAuthenticated()) {
      return res.status(400).json({ error: 'You are already logged in.' });
    }
    const { email, password } = req.body;
    const validateLogin = User.validateLogin(email, password);
    if (!_.isNil(validateLogin.error)) {
      return res.status(422).json({ error: validateLogin.error });
    }
    return passport.authenticate('local', async (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(422).json({ error: info.message });
      try {
        const isUserAccountActive = await User.isActive(validateLogin.normalizedEmail);
        if (!isUserAccountActive) {
          return res.status(422).json({ error: 'Your account has not been activated yet.' });
        }
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: 'Oooops. Something went wrong.' });
      }
      return req.logIn(user, err2 => {
        if (err) return next(err2);
        return res.sendStatus(200);
      });
    })(req, res, next);
  },
  /**
   * Signup
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {undefined}
   */
  async signup(req, res) {
    if (req.isAuthenticated()) {
      return res.status(400).json({ error: 'You are already logged in.' });
    }
    const { email, password, passwordDuplicate } = req.body;
    const validateSignup = User.validateSignup(email, password, passwordDuplicate);
    if (!_.isNil(validateSignup.error)) {
      return res.status(422).json({ error: validateSignup.error });
    }
    try {
      // generate token to activate account
      const token = uuidv4();
      const user = await User.createUser(validateSignup.normalizedEmail, password, token);
      if (user) return res.sendStatus(201);
      return res.status(422).json({ error: 'Email already registred.' });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'Oooops. Something went wrong.' });
    }
  },
  /**
   * Change password
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async changePassword(req, res) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'You are not logged in.' });
    }
    const userId = req.user;
    const { newPassword, currentPassword } = req.body;
    try {
      const changedPassword = await User.changePassword(userId, currentPassword, newPassword);
      if (changedPassword) {
        return res.sendStatus(200);
      } else if (changedPassword.error) {
        return res.status(400).json({ error: changedPassword.error });
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'Oooops. Something went wrong.' });
    }
  },
  /**
   * Activate user account
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async activateAccount(req, res) {
    const { token } = req.params;
    try {
      const activatedAccout = await User.activateAccount(token);
      if (activatedAccout) {
        return res.cookie('message_success', 'Your account has been activated! You can now login.');
      }
    } catch (e) {
      console.log(e);
      return res.cookie('message_error', 'Oooops. Something went wrong.');
    }
    return res.redirect('/');
  },
};

module.exports = authController;
