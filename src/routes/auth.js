import express from 'express';
import {
    validateRecaptcha,
    resetPasswordRequest,
    resetPasswordWithToken,
    resetPassword,
    login,
    signup,
    logout,
} from '../controllers/auth';

const router = express.Router();

router.post('/login', login);
router.post('/signup', validateRecaptcha, signup);
router.get('/logout', logout);
router.post('/reset', validateRecaptcha, resetPasswordRequest);
router.get('/reset/:email/:token', resetPasswordWithToken);
router.post('/reset/:email/:token', resetPassword);

module.exports = router;
