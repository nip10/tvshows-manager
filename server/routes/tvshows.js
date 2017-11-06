import express from 'express';

import TvShows from './../controllers/tvshows';

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
            tvshowInfo = Object.assign(tvshowData[0], { images: [tvshowData[0].images[0], tvshowData[1]] });
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
        description: tvshowInfo.description,
        premiered: tvshowInfo.premiered,
        network: tvshowInfo.network,
        status: tvshowInfo.status,
        airdate: tvshowInfo.airdate,
        season: latestSeason,
        episodes,
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

router.get('/:showid/add', async (req, res) => {
    const { showid } = req.params;
    const userId = req.user;
    try {
        const addShowToUser = await TvShows.addShowToUser(userId, showid);
        res.json({ addShowToUser });
    } catch (e) {
        console.log(e);
    }
});

module.exports = router;
