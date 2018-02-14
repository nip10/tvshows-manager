import express from 'express';

import { isLoggedInWithMessage } from '../controllers/auth';
import { getProfile } from '../controllers/user';

const router = express.Router();

router.get('/profile', isLoggedInWithMessage, getProfile);

module.exports = router;
