import express from 'express';
import uuidv4 from 'uuid/v4';
import moment from 'moment';
import passport from '../auth/local';
import {
    createUser,
    validateLogin,
    validateRegister,
    validateRecaptcha,
    validateEmail,
    validateEmailInUrl,
    validatePassword,
    addTokenToUser,
    checkIfTokenIsValid,
    checkIfUserExistsByEmail,
    changeUserPassword,
} from '../auth/utils';

const router = express.Router();

router.post('/login', validateLogin, passport.authenticate('local'), (req, res) => res.json({ message: '/calendar' }));

router.post('/register', validateRecaptcha, validateRegister, (req, res) => createUser(req, res)
    .then(() => passport.authenticate('local')(req, res, () => res.json({ message: '/calendar' })))
    .catch(err => res.status(500).json({ error: err })));

router.get('/logout', (req, res) => {
    req.logout();
    // logout() is not enough, so I use session.destroy()
    // the redirect is done in the callback to make sure
    // the session is destroyed before the redirect
    req.session.destroy((err) => {
        console.log(err);
        return res.redirect('/');
    });
});

router.post('/reset', validateRecaptcha, validateEmail, async (req, res) => {
    const { email } = req.body;
    try {
        const userExists = await checkIfUserExistsByEmail(email);
        if (!userExists) {
            return res.status(400).json({ error: 'Invalid email address !' });
        }
        const reset = {
            token: uuidv4(),
            expiration: moment().add(15, 'minutes').toISOString(), // token is valid for 15 minutes
        };
        const addToken = await addTokenToUser(email, reset);
        if (!addToken) {
            throw new Error();
        }
        console.log(`New token generated for ${email}: ${reset.token}. Expires at: ${reset.expiration}`);
    } catch (e) {
        return res.status(500).json({ error: 'Oooops. Something went wrong.' });
    }
    // TODO: Send email here
    return res.json({ message: 'An email has been sent to your email address.' });
});

router.get('/reset/:email/:token', validateEmailInUrl, async (req, res) => {
    const { email, token } = req.params;
    try {
        const isTokenValid = await checkIfTokenIsValid(email, token);
        if (!isTokenValid) {
            return res.render('error', {
                message: 'Token is not valid or has already expired.',
            });
        }
        return res.render('index', {
            title: 'Tv-shows Manager',
            resetPassword: true,
        });
    } catch (e) {
        console.log(e);
        return res.render('error', {
            message: 'Oooops. Something went wrong.',
        });
    }
});

router.post('/reset/:email/:token', validateEmailInUrl, validatePassword, async (req, res) => {
    const { password } = req.body;
    const { email, token } = req.params;
    try {
        const isTokenValid = await checkIfTokenIsValid(email, token);
        if (!isTokenValid) {
            return res.status(422).json({ error: 'Invalid token. Please request a new token.' });
        }
        const changedPassword = await changeUserPassword(email, password);
        console.log('changedPassword: ', changedPassword);
        if (!changedPassword) {
            throw new Error();
        }
        return res.json({ message: 'Password changed successfully !' });
    } catch (e) {
        return res.status(500).json({ error: 'Oooops. Something went wrong.' });
    }
});

module.exports = router;
