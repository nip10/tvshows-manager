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
router.delete('/:tvshowId/remove', isLoggedIn, removeTvshow);
router.post('/:tvshowId/episode/:episodeId', isLoggedIn, setEpisodeWatchedStatus);
router.post('/:tvshowId/season/:seasonNum', isLoggedIn, setSeasonWatched);

module.exports = router;
