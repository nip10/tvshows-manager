import express from 'express';
import {
  isLoggedIn,
  validateRecaptcha,
  resetPasswordRequest,
  resetPasswordWithToken,
  resetPassword,
  changePassword,
  login,
  signup,
  logout,
  activateAccount,
  resendActivateAccount,
} from '../controllers/auth';

const router = express.Router();

router.post('/login', login);
router.post('/activate', resendActivateAccount);
router.get('/activate/:token', activateAccount);
router.post('/signup', validateRecaptcha, signup);
router.get('/logout', logout);
router.post('/reset', validateRecaptcha, resetPasswordRequest);
router.get('/reset/:email/:token', resetPasswordWithToken);
router.post('/reset/:email/:token', resetPassword);
router.post('/changepassword', isLoggedIn, changePassword);

module.exports = router;
