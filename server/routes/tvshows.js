import express from 'express';

import TvShows from './../controllers/tvshows';

const router = express.Router();

router.get('/search/:name', (req, res) => {
    const tvshow = req.params.name;
    TvShows.search(tvshow).then(data => res.send(data)).catch(e => console.log(e.message));
});

router.get('/:name', (req, res) => {
    const tvshow = req.params.name;
    res.render('tvshow', {
        title: 'Tv-shows Manager',
        name: 'The Blacklist',
        banner: 'https://www.thetvdb.com/banners/graphical/266189-g20.jpg',
        poster: 'https://www.thetvdb.com/banners/posters/266189-13.jpg',
    });
    // TvShows.getInfo(tvshow).then((data) => {
    //     res.render('tvshow', {
    //         title: 'Tv-shows Manager',
    //         name: 'The Blacklist',
    //         banner: 'https://www.thetvdb.com/banners/graphical/266189-g20.jpg',
    //         poster: 'https://www.thetvdb.com/banners/posters/266189-13.jpg',
    //     });
    // }).catch((e) => {
    //     res.render('error', {
    //         message: 'Server Error. Try again later',
    //         error: e,
    //     });
    // });
});

module.exports = router;
