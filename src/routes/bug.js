import express from 'express';
import submitBug from '../controllers/bug';

const router = express.Router();

router.post('/', submitBug);

module.exports = router;
