import express from 'express';

import TvShows from './../controllers/tvshows';
import { isLoggedIn } from './../auth/utils';

const router = express.Router();

router.get('/search/:name', async (req, res) => {
    const tvshowName = req.params.name;
    try {
        const searchResults = await TvShows.search(tvshowName);
        res.json(searchResults);
    } catch (e) {
        console.log(e);
    }
});

router.get('/:showid', async (req, res) => {
    const { showid } = req.params;
    const userId = req.user;
    let isShowOnDb;
    try {
        isShowOnDb = await TvShows.isShowOnDb(showid);
    } catch (e) {
        // assume db is offline/unreachable
        isShowOnDb = false;
    }
    let latestSeason;
    try {
        latestSeason = await TvShows.getNumSeasons(showid);
    } catch (e) {
        // assume season #1
        latestSeason = 1;
    }
    let isUserFollowingTvshow = false;
    if (userId) {
        try {
            isUserFollowingTvshow = await TvShows.isUserFollowingTvshow(userId, showid);
        } catch (e) {
            console.log(e);
        }
    }
    let tvshowInfo;
    let episodes;
    if (isShowOnDb) {
        // Get show information and episodes from the database
        console.log(`Requested tvshow id ${showid}. Data is on the db.`);
        try {
            const tvShowData = await Promise.all([
                TvShows.getTvshowInfoFromDb(showid),
                TvShows.getEpisodesFromDb(showid, latestSeason),
            ]);
            [tvshowInfo, episodes] = tvShowData;
        } catch (e) {
            console.log(e);
        }
    } else {
        // Get show information and episodes from the thetvdb api
        try {
            console.log(`Requested tvshow id ${showid}. Data is not on the db.`);
            const tvshowData = await Promise.all([
                TvShows.getInfo(showid),
                TvShows.getImage(showid, 'poster'),
                TvShows.getEpisodesFromSeason(showid, latestSeason),
            ]);
            tvshowInfo = Object.assign(
                tvshowData[0],
                { images: [tvshowData[0].images[0], tvshowData[1]] },
            );
            [,, episodes] = tvshowData;
            // TODO: spawn child to take care of this ?
            console.log(`Adding info/episodes of tvshow id ${showid} to the db.`);
            TvShows.addShowToDb(tvshowInfo);
        } catch (e) {
            console.log(e);
        }
    }
    res.render('tvshow', {
        title: 'Tv-shows Manager',
        name: tvshowInfo.name,
        banner: `https://www.thetvdb.com/banners/${tvshowInfo.images[0]}`,
        poster: `https://www.thetvdb.com/banners/${tvshowInfo.images[1]}`,
        overview: tvshowInfo.overview,
        premiered: tvshowInfo.premiered,
        network: tvshowInfo.network,
        status: tvshowInfo.status,
        airdate: tvshowInfo.airdate,
        season: latestSeason,
        episodes,
        isUserFollowingTvshow,
        isAuthenticated: !!userId,
    });
});

router.get('/:showid/episodes', async (req, res) => {
    const { showid } = req.params;
    const { season } = req.query;
    try {
        const episodes = await TvShows.getEpisodesFromDb(showid, season);
        res.json({ episodes });
    } catch (e) {
        console.log(e);
    }
});

router.get('/:showid/add', isLoggedIn, async (req, res) => {
    // adding a show that a user is already following results in the same behavious as if he wasnt
    const { showid } = req.params;
    const userId = req.user;
    let isUserFollowingTvshow = false;
    try {
        isUserFollowingTvshow = await TvShows.isUserFollowingTvshow(userId, showid);
    } catch (e) {
        console.log(e);
    }
    if (!isUserFollowingTvshow) {
        try {
            const addShowToUser = await TvShows.addShowToUser(userId, showid);
            res.json(addShowToUser);
        } catch (e) {
            console.log(e);
            res.status(500).json({ error: 'Server error. Please try again later.' });
        }
    } else {
        // User is already following this tvshow
        res.status(400).json({ error: 'You are already following this show.' });
    }
});

router.get('/:showid/remove', isLoggedIn, async (req, res) => {
    const { showid } = req.params;
    const userId = req.user;
    let isUserFollowingTvshow = false;
    try {
        isUserFollowingTvshow = await TvShows.isUserFollowingTvshow(userId, showid);
    } catch (e) {
        console.log(e);
    }
    if (isUserFollowingTvshow) {
        try {
            const removeShowFromUser = await TvShows.removeShowFromUser(userId, showid);
            res.json(removeShowFromUser);
        } catch (e) {
            console.log(e);
        }
    } else {
        // User is not following this tvshow
        res.status(400).json({ error: 'You are not following this show.' });
    }
});

module.exports = router;
