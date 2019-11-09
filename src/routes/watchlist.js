import express from 'express';

import { isLoggedIn, isLoggedInWithMessage } from '../controllers/auth';
import { getWatchlist, getNumberOfUnwatchedEpisodes } from '../controllers/user';

const router = express.Router();

router.get('/', isLoggedInWithMessage, getWatchlist);
router.get('/count', isLoggedIn, getNumberOfUnwatchedEpisodes);

module.exports = router;
