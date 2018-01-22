import express from 'express';
import passport from '../auth/local';
import { createUser } from '../controllers/user';
import {
    validateLogin,
    validateRegister,
    validateRecaptcha,
    validateEmail,
    validateEmailInUrl,
    validatePassword,
    resetPasswordRequest,
    resetPasswordWithToken,
    resetPassword,
    logout,
} from '../controllers/auth';

const router = express.Router();

router.post('/login', validateLogin, passport.authenticate('local'), (req, res) => res.json({ message: '/calendar' }));
router.post('/register', validateRecaptcha, validateRegister, createUser, passport.authenticate('local').bind(this), (req, res) => res.json({ message: '/calendar' }));
router.get('/logout', logout);
router.post('/reset', validateRecaptcha, validateEmail, resetPasswordRequest);
router.get('/reset/:email/:token', validateEmailInUrl, resetPasswordWithToken);
router.post('/reset/:email/:token', validateEmailInUrl, validatePassword, resetPassword);

module.exports = router;
