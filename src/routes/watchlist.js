import express from 'express';

import { isLoggedInWithMessage } from '../controllers/auth';
import { getWatchlist } from '../controllers/user';

const router = express.Router();

router.get('/', isLoggedInWithMessage, getWatchlist);

module.exports = router;
