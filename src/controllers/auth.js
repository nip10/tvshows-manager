import uuidv4 from 'uuid/v4';
import moment from 'moment';
import validator from 'validator';
import rp from 'request-promise';
import _ from 'lodash';
import passport from '../auth/local';
import User from '../models/user';
import CONSTANTS from '../utils/constants';
import mail from '../mail/mail';

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
    return res.status(401).json({ error: CONSTANTS.ERROR.AUTH.REQUIRED });
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
    res.cookie('message_error', CONSTANTS.ERROR.AUTH.REQUIRED);
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
    if (isDev) return next();
    const { recaptcha } = req.body;
    if (!recaptcha) {
      return res.status(401).json({ error: CONSTANTS.ERROR.AUTH.RECAPTCHA });
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
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
    if (!email || !validator.isEmail(email)) {
      return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.INVALID_EMAIL });
    } else if (email !== emailDuplicate) {
      return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.EMAIL_MATCH });
    }
    const normalizedEmail = validator.normalizeEmail(email);
    try {
      const userExists = await User.existsByEmail(normalizedEmail);
      if (!userExists) {
        return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.INVALID_EMAIL });
      }
      const reset = {
        token: uuidv4(),
        expiration: moment()
          .add(RESET_PASSWORD_TOKEN_EXPIRATION, 'minutes')
          .toISOString(),
      };
      const addedToken = await User.addResetTokenToUser(normalizedEmail, reset);
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
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
    const { email, token } = req.params;
    const normalizedEmail = validator.normalizeEmail(email);
    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
      return res.status(422).render('error', {
        error: CONSTANTS.ERROR.AUTH.INVALID_EMAIL,
      });
    }
    if (!token) {
      return res.status(422).render('error', {
        error: CONSTANTS.ERROR.AUTH.INVALID_TOKEN,
      });
    }
    try {
      const isTokenValid = await User.checkIfTokenIsValid(normalizedEmail, token);
      if (!isTokenValid) {
        return res.status(422).render('error', {
          error: CONSTANTS.ERROR.AUTH.INVALID_TOKEN,
        });
      }
      return res.render('index', {
        resetPassword: true,
      });
    } catch (e) {
      console.log(e);
      return res.status(500).render('error', {
        error: CONSTANTS.ERROR.SERVER,
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
      return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.INVALID_EMAIL });
    }
    if (!token) {
      return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.INVALID_TOKEN });
    }
    if (!password || password.length < 8 || password.length > 30) {
      return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.PASSWORD_LEN });
    }
    if (password !== passwordDuplicate) {
      return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.PASSWORD_MATCH });
    }
    try {
      const isTokenValid = await User.checkIfTokenIsValid(normalizedEmail, token);
      if (!isTokenValid) return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.INVALID_TOKEN });
      const resetdPassword = await User.resetPassword(normalizedEmail, password);
      if (!resetdPassword) throw new Error();
      return res.json({ message: 'Password changed successfully.' });
    } catch (e) {
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
      return res.status(400).json({ error: CONSTANTS.ERROR.AUTH.ALREADY_AUTHENTICATED });
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
        if (!isUserAccountActive) return res.status(403).json({ error: CONSTANTS.ERROR.AUTH.NOT_ACTIVATED });
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
      return res.status(400).json({ error: CONSTANTS.ERROR.AUTH.ALREADY_AUTHENTICATED });
    }
    const { email, password, passwordDuplicate } = req.body;
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
          return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
        }
      }
      return res.status(422).json({ error: CONSTANTS.ERROR.AUTH.EMAIL_EXISTS });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
    const userId = req.user;
    const { newPassword, currentPassword } = req.body;
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
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
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
      const activatedAccount = await User.activateAccount(token);
      if (!activatedAccount) {
        res.cookie('message_error', 'Your account is already activated.');
      } else {
        res.cookie('message_success', 'Your account has been activated. You can now login.');
      }
    } catch (e) {
      console.log(e);
      res.cookie('message_error', CONSTANTS.ERROR.SERVER);
    }
    return res.redirect('/');
  },
  /**
   * Resend activation email
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {undefined}
   */
  async resendActivateAccount(req, res) {
    const { email } = req.body;
    try {
      const validateUser = await Promise.all([User.existsByEmail(email), User.isActive(email)]);
      if (validateUser[0] && !validateUser[1]) {
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
      return res.status(500).json({ error: CONSTANTS.ERROR.SERVER });
    }
  },
};

module.exports = authController;
