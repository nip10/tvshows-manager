import uuidv4 from 'uuid/v4';
import moment from 'moment';
import validator from 'validator';
import rp from 'request-promise';
import _ from 'lodash';
import passport from '../auth/local';
import User from '../models/user';
import { ERROR } from '../utils/constants';
import Mail from '../mail/mail';

const { RECAPTCHA_SECRET, NODE_ENV, RECAPTCHA_VERIFY_URL, RESET_PASSWORD_TOKEN_EXPIRATION } = process.env;
const isDev = NODE_ENV === 'development';

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
    return res.status(401).json({ error: ERROR.AUTH.REQUIRED });
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
    res.cookie('message_error', ERROR.AUTH.REQUIRED);
    return res.redirect('/tsm');
  },
  /**
   * Check if a user is logged-in
   * If true, redirect to /calender
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {undefined}
   */
  isLoggedInWithRedirect(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/tsm/calendar');
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
    // Skip recaptcha if we are in development env
    if (isDev) return next();
    const recaptcha = _.get(req.body, 'recaptcha');
    if (_.isNil(recaptcha)) {
      return res.status(401).json({ error: ERROR.AUTH.RECAPTCHA });
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
      if (!data.success) throw new Error();
      return next();
    } catch (e) {
      return res.status(500).json({ error: ERROR.SERVER });
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
    // note: destroy callback has 'err' available in the callback
    req.session.destroy(() => res.redirect('/tsm'));
  },
  /**
   * Request password reset
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async resetPasswordRequest(req, res) {
    const email = _.get(req.body, 'email');
    const emailDuplicate = _.get(req.body, 'emailDuplicate');
    // isString is needed because validator only accepts strings
    if (
      !_.isString(email) ||
      !_.isString(emailDuplicate) ||
      !validator.isEmail(email) ||
      !validator.isEmail(emailDuplicate)
    ) {
      return res.status(422).json({ error: ERROR.AUTH.INVALID_EMAIL });
    } else if (email !== emailDuplicate) {
      return res.status(422).json({ error: ERROR.AUTH.EMAIL_MATCH });
    }
    const normalizedEmail = validator.normalizeEmail(email);
    try {
      const userExists = await User.getUserIdByEmail(normalizedEmail);
      if (!userExists) {
        return res.status(422).json({ error: ERROR.AUTH.INVALID_EMAIL });
      }
      const resetParams = {
        token: uuidv4(),
        expiration: moment()
          .add(RESET_PASSWORD_TOKEN_EXPIRATION, 'minutes')
          .toISOString(),
      };
      const addedToken = await User.addResetTokenToUser(normalizedEmail, resetParams);
      if (!addedToken) throw new Error();
      const sentEmail = await mail.sendEmail(normalizedEmail, 'reset', { email: normalizedEmail, token: reset.token });
      if (!sentEmail) {
        return res.status(400).json({
          error: `Couldn't send email to ${normalizedEmail}.
              Please check if the email address is correct and try again. `,
        });
      }
      return res.json({ message: 'An email has been sent to your email address.' });
    } catch (e) {
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
  /**
   * Request password reset with token
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async resetPasswordWithToken(req, res) {
    const email = _.get(req.params, 'email');
    const token = _.get(req.params, 'token');
    if (!_.isString(email) || !validator.isEmail(email)) {
      return res.status(422).render('error', {
        error: ERROR.AUTH.INVALID_EMAIL,
      });
    }
    const normalizedEmail = validator.normalizeEmail(email);
    if (!_.isString(token) || _.isEmpty(token)) {
      return res.status(422).render('error', {
        error: ERROR.AUTH.INVALID_TOKEN,
      });
    }
    try {
      const isTokenValid = await User.checkIfTokenIsValid(normalizedEmail, token);
      if (!isTokenValid) {
        return res.status(422).render('error', {
          error: ERROR.AUTH.INVALID_TOKEN,
        });
      }
      return res.render('index', {
        resetPassword: true,
      });
    } catch (e) {
      return res.status(500).render('error', {
        error: ERROR.SERVER,
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
    const password = _.get(req.body, 'password');
    const passwordDuplicate = _.get(req.body, 'passwordDuplicate');
    const email = _.get(req.params, 'email');
    const token = _.get(req.params, 'token');
    if (!_.isString(email) || !validator.isEmail(email)) {
      return res.status(422).json({ error: ERROR.AUTH.INVALID_EMAIL });
    }
    const normalizedEmail = validator.normalizeEmail(email);
    if (!_.isString(token) || _.isEmpty(token)) {
      return res.status(422).json({ error: ERROR.AUTH.INVALID_TOKEN });
    }
    if (!_.isString(password) || password.length < 8 || password.length > 30) {
      return res.status(422).json({ error: ERROR.AUTH.PASSWORD_LEN });
    }
    if (password !== passwordDuplicate) {
      return res.status(422).json({ error: ERROR.AUTH.PASSWORD_MATCH });
    }
    try {
      const isTokenValid = await User.checkIfTokenIsValid(normalizedEmail, token);
      if (!isTokenValid) return res.status(422).json({ error: ERROR.AUTH.INVALID_TOKEN });
      const resetdPassword = await User.resetPassword(normalizedEmail, password);
      if (!resetdPassword) throw new Error();
      return res.json({ message: 'Password changed successfully.' });
    } catch (e) {
      return res.status(500).json({ error: ERROR.SERVER });
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
      return res.status(400).json({ error: ERROR.AUTH.ALREADY_AUTHENTICATED });
    }
    const email = _.get(req.body, 'email');
    const password = _.get(req.body, 'password');
    const validateLogin = User.validateLogin(email, password);
    if (!_.isNil(validateLogin.error)) {
      return res.status(422).json({ error: validateLogin.error });
    }
    return passport.authenticate('local', async (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(422).json({ error: info.message });
      try {
        // TODO: Move this to the local auth strategy implementation
        const isUserAccountActive = await User.isActive(validateLogin.normalizedEmail);
        if (!isUserAccountActive) return res.status(403).json({ error: ERROR.AUTH.NOT_ACTIVATED });
        await User.updateLastLogin(user.id);
        return req.logIn(user, err2 => {
          if (err2) return next(err2);
          return res.sendStatus(200);
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: ERROR.SERVER });
      }
    })(req, res, next);
  },
  /**
   * Login with facebook
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {undefined}
   */
  async loginFb(req, res, next) {
    if (req.isAuthenticated()) {
      res.cookie('message_error', ERROR.AUTH.ALREADY_AUTHENTICATED);
      return res.redirect('/tsm');
    }
    return passport.authenticate('facebook', async (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(422).json({ error: info.message });
      try {
        // TODO: Move this to the local auth strategy implementation
        // const isUserAccountActive = await User.isActive(validateLogin.normalizedEmail);
        // if (!isUserAccountActive) return res.status(403).json({ error: ERROR.AUTH.NOT_ACTIVATED });
        await User.updateLastLogin(user.id); // TODO: Test this
        return req.logIn(user, err2 => {
          if (err2) return next(err2);
          return res.sendStatus(200);
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: ERROR.SERVER });
      }
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
      return res.status(400).json({ error: ERROR.AUTH.ALREADY_AUTHENTICATED });
    }
    const email = _.get(req.body, 'email');
    const password = _.get(req.body, 'password');
    const passwordDuplicate = _.get(req.body, 'passwordDuplicate');
    const validateSignup = User.validateSignup(email, password, passwordDuplicate);
    if (!_.isNil(validateSignup.error)) {
      return res.status(422).json({ error: validateSignup.error });
    }
    try {
      const activateAccountToken = uuidv4();
      const user = await User.createUser(validateSignup.normalizedEmail, password, activateAccountToken);
      if (user.id) {
        try {
          const sentEmail = await mail.sendEmail(email, 'welcome', { token: activateAccountToken });
          if (!sentEmail) {
            return res.status(400).json({
              error: `Couldn't send email to ${email}.
              Please check if the email address is correct and try again. `,
            });
          }
          return res.sendStatus(201);
        } catch (e) {
          return res.status(500).json({ error: ERROR.SERVER });
        }
      }
      return res.status(422).json({ error: ERROR.AUTH.EMAIL_EXISTS });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
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
    const userId = Number.parseInt(req.user, 10);
    const newPassword = _.get(req.body, 'newPassword');
    const currentPassword = _.get(req.body, 'currentPassword');
    try {
      const changedPassword = await User.changePassword(userId, currentPassword, newPassword);
      if (changedPassword && !changedPassword.error) {
        return res.sendStatus(200);
      } else if (changedPassword.error) {
        return res.status(400).json({ error: changedPassword.error });
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
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
    const token = _.get(req.params, 'token');
    try {
      const activatedAccount = await User.activateAccount(token);
      if (!activatedAccount) {
        res.cookie('message_error', 'Your account is already activated.');
      } else {
        res.cookie('message_success', 'Your account has been activated. You can now login.');
      }
    } catch (e) {
      console.log(e);
      res.cookie('message_error', ERROR.SERVER);
    }
    return res.redirect('/tsm');
  },
  /**
   * Resend activation email
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async resendActivateAccount(req, res) {
    const email = _.get(req.body, 'email');
    if (!_.isString(email) || !validator.isEmail(email)) {
      return res.status(400).json({ error: ERROR.AUTH.INVALID_EMAIL });
    }
    const normalizedEmail = validator.normalizeEmail(email);
    try {
      const validateUser = await Promise.all([User.getUserIdByEmail(email), User.isActive(email)]);
      if (validateUser[0].id && !validateUser[1]) {
        const activationToken = uuidv4();
        const addedToken = await User.addActivationTokenToUser(email, activationToken);
        if (!addedToken) throw new Error();
        const sentEmail = await mail.sendEmail(email, 'welcome', { token: activationToken });
        if (!sentEmail) {
          return res.status(400).json({
            error: `Couldn't send email to ${email}.
                Please check if the email address is correct and try again. `,
          });
        }
        return res.json({ message: `Activation email sent to ${email}` });
      } else if (validateUser[0] && validateUser[1]) {
        return res.status(400).json({ error: 'Your account is already activated.' });
      }
      throw new Error();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
    }
  },
};

module.exports = authController;
