import express from 'express';
import { isLoggedInWithRedirect } from '../controllers/auth';

const router = express.Router();

router.get('/', isLoggedInWithRedirect, (req, res) => res.render('index'));

module.exports = router;
