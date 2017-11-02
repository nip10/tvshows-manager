import express from 'express';

import TvShows from './../controllers/tvshows';

const router = express.Router();

router.get('/search/:name', async (req, res) => {
    const tvshowName = req.params.name;
    try {
        const searchResults = await TvShows.search(tvshowName);
        res.send(searchResults);
    } catch (e) {
        console.log(e);
    }
});

router.get('/:showid', async (req, res) => {
    const { showid } = req.params;
    // Check if the show is already on the database
    const isShowOnDb = await TvShows.isShowOnDb(showid);
    const latestSeason = await TvShows.getNumSeasons(showid);
    let tvshowInfo;
    let episodes;
    if (isShowOnDb) {
        // Get show information and episodes from the database
        console.log(`tvshow id ${showid} is on the db`);
        try {
            tvshowInfo = await TvShows.getTvshowInfoFromDb(showid);
            console.log('tvshowinfo from db');
            console.log(JSON.stringify(tvshowInfo, null, 4));
            episodes = await TvShows.getEpisodesFromDb(showid, latestSeason);
            // console.log(JSON.stringify(episodes[0], null, 4));
        } catch (e) {
            console.log(e);
        }
    } else {
        // Get show information and episodes from the thetvdb api
        try {
            console.log(`tvshow id ${showid} is not on the db`);
            const tvshowData = await Promise.all([TvShows.getInfo(showid), TvShows.getImage(showid, 'poster'), TvShows.getEpisodesFromSeason(showid, latestSeason)]);
            // console.log('tvshowData[0]');
            // console.log(JSON.stringify(tvshowData[0], null, 4));
            // console.log('tvshowData[1]');
            // console.log(JSON.stringify(tvshowData[1], null, 4));
            tvshowInfo = Object.assign(tvshowData[0], { images: [tvshowData[0].images[0], tvshowData[1]] });
            console.log('tvshowinfo from api');
            console.log(JSON.stringify(tvshowInfo, null, 4));
            episodes = tvshowData[2];
            // TODO: spawn child to take care of this ?
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
        // TODO: this handles the season select menu
        // at this point, the show should/is in the database
        // so theres no need to use the thetvdb api.. just fetch the episodes from the db
        const episodes = await TvShows.getEpisodesFromSeason(showid, season);
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
