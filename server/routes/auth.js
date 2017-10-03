import express from 'express';
import { createUser } from '../auth/utils';
import passport from '../auth/local';

const router = express.Router();

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: '/portfolio' });
});

router.post('/signup', (req, res) => {
    // validate inputs
    createUser(req, res)
        .then(() => {
            passport.authenticate('local')(req, res, () => {
                res.json({ message: '/calendar' });
            });
        })
        .catch(err => res.status(500).json({ error: err }));
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;
