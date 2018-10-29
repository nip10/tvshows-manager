import express from 'express';
import getCalendar from '../controllers/calendar';
import { isLoggedInWithMessage } from '../controllers/auth';

const router = express.Router();

router.get('/', isLoggedInWithMessage, getCalendar);
router.get('/:year/:month', isLoggedInWithMessage, getCalendar);

module.exports = router;
