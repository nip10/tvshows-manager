import express from 'express';
import { search, searchFull, getEpisodes, getData } from '../controllers/tvshow';
import { addTvshow, removeTvshow, setEpisodeWatchedStatus, setSeasonWatched } from '../controllers/user';
import { isLoggedIn } from '../controllers/auth';

const router = express.Router();

router.get('/search/:tvshowName', search);
router.get('/search_full/:tvshowName', searchFull);
router.get('/:tvshowId', getData);
router.get('/:tvshowId/episodes', getEpisodes);
router.post('/:tvshowId/add', isLoggedIn, addTvshow);
router.post('/:tvshowId/remove', isLoggedIn, removeTvshow);
router.post('/:tvshowId/ep', isLoggedIn, setEpisodeWatchedStatus);
router.post('/:tvshowId/s', isLoggedIn, setSeasonWatched);

module.exports = router;
