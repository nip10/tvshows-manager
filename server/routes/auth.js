import express from 'express';
import validator from 'validator';
import { createUser } from '../auth/utils';
import passport from '../auth/local';

const router = express.Router();

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: '/calendar' });
});

router.post('/register', (req, res) => {
    const { email, password, passwordDuplicate } = req.body;
    if (!validator.isEmail(email)) {
        res.status(422).json({ error: 'Invalid email address.' });
    } else if (password.length < 6 || passport.length > 20) {
        res.status(422).json({ error: 'Invalid password. Please choose a password between 6-20 characters.' });
    } else if (password !== passwordDuplicate) {
        res.status(422).json({ error: 'Passwords don\'t match.' });
    } else {
        createUser(req, res)
            .then(() => {
                passport.authenticate('local')(req, res, () => {
                    res.json({ message: '/calendar' });
                });
            })
            .catch(err => res.status(500).json({ error: err }));
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;
