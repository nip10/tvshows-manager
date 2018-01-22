import express from 'express';
import {
    search,
    isTvshowOnDb,
    getTvshowDataFromDb,
    getTvshowDataFromApi,
    isUserFollowingTvshow,
    renderTvshowView,
    getEpisodesFromSeasonFromDb,
} from '../controllers/tvshow';
import { addTvshowToUser, removeTvshowFromUser } from '../controllers/user';
import { isLoggedIn } from '../controllers/auth';

const router = express.Router();

router.get('/search/:tvshowName', search);
router.get('/:tvshowId', isTvshowOnDb, getTvshowDataFromDb, getTvshowDataFromApi, isUserFollowingTvshow, renderTvshowView);
router.get('/:tvshowId/episodes', getEpisodesFromSeasonFromDb);
router.get('/:tvshowId/add', isLoggedIn, addTvshowToUser);
router.get('/:tvshowId/remove', isLoggedIn, removeTvshowFromUser);

module.exports = router;
