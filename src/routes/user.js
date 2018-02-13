import express from 'express';

import { isLoggedInWithMessage } from '../controllers/auth';
import { getUserProfile } from '../controllers/user';

const router = express.Router();

router.get('/profile', isLoggedInWithMessage, getUserProfile);

module.exports = router;
