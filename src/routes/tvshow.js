import express from 'express';
import { search, getEpisodes, getData } from '../controllers/tvshow';
import { addTvshowToUser, removeTvshowFromUser } from '../controllers/user';
import { isLoggedIn } from '../controllers/auth';

const router = express.Router();

router.get('/search/:tvshowName', search);
router.get('/:tvshowId', getData);
router.get('/:tvshowId/episodes', getEpisodes);
router.get('/:tvshowId/add', isLoggedIn, addTvshowToUser);
router.get('/:tvshowId/remove', isLoggedIn, removeTvshowFromUser);

module.exports = router;
