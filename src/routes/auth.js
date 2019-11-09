import express from 'express';
import {
  isLoggedIn,
  validateRecaptcha,
  resetPasswordRequest,
  resetPasswordWithToken,
  resetPassword,
  changePassword,
  login,
  loginFb,
  signup,
  logout,
  activateAccount,
  resendActivateAccount,
} from '../controllers/auth';
import passport from '../auth/local';

const router = express.Router();

router.post('/login', login);
router.get('/login/fb', loginFb);
router.get(
  '/login/fb/cb',
  passport.authenticate('facebook', {
    successRedirect: '/tsm/calendar',
    failureRedirect: '/tsm',
  })
);
router.post('/activate', resendActivateAccount);
router.get('/activate/:token', activateAccount);
router.post('/signup', validateRecaptcha, signup);
router.get('/logout', logout);
router.post('/reset', validateRecaptcha, resetPasswordRequest);
router.get('/reset/:email/:token', resetPasswordWithToken);
router.post('/reset/:email/:token', resetPassword);
router.post('/changepassword', isLoggedIn, changePassword);

module.exports = router;
