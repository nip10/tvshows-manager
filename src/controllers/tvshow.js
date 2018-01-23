/* eslint-disable quote-props */
/* eslint-disable func-names */

import _ from 'lodash';
import Tvshow from '../models/tvshow';
import User from '../models/user';

/**
 * Tvshow controller - All functions related to the tvshows feature
 * @module controllers/tvshow
 */

const tvshowsController = {
    /**
     * Search for a tvshow (calls external api)
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async search(req, res) {
        const { tvshowName } = req.params;
        if (!_.isString(tvshowName)) {
            return res.status(400).json({ error: 'Invalid tvshow name.' });
        }
        try {
            const data = await Tvshow.search(tvshowName);
            if (_.isNull(data)) {
                return res.json({ error: 'Tvshow not found.' });
            }
            return res.json(data);
        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: 'Server error.' });
        }
    },
    /**
     * Get episodes from the db
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async getEpisodes(req, res) {
        const { tvshowId } = req.params;
        const { season } = req.query;
        try {
            const episodes = await Tvshow.getEpisodesFromSeasonFromDb(tvshowId, season);
            return res.json({ episodes });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: 'Server error.' });
        }
    },
    /**
     * Get tvshow data (and render)
     *
     * 1. Get tvshow data from the db
     * If tvshow data is NOT on the db,
     * 2. Get tvshow data from the api
     * 3. Check if user is following the tvshow (if logged in)
     * 4. Render tvshow view
     *
     * tvshowdata is the tvshow info + episodes
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    async getData(req, res, next) {
        const { tvshowId } = req.params;
        // Check if the tvshow is on the db
        let isTvshowOnDb;
        try {
            isTvshowOnDb = await Tvshow.isOnDb(tvshowId);
        } catch (e) {
            console.log(e);
            isTvshowOnDb = false;
        }
        let tvshowData;
        if (isTvshowOnDb) {
            // Get tvshow data from the db
            try {
                const latestSeason = await Tvshow.getLatestSeasonFromDb(tvshowId);
                const getTvshowData = await Promise.all([
                    Tvshow.getInfoFromDb(tvshowId),
                    Tvshow.getEpisodesFromSeasonFromDb(tvshowId, latestSeason),
                ]);
                tvshowData = Object.assign(
                    {},
                    getTvshowData[0],
                    { episodes: getTvshowData[1] },
                    { latestSeason },
                );
            } catch (e) {
                console.log(e);
            }
        } else {
            // Get tvshow data from the api
            try {
                // Get latest season (in order to display the last season episodes)
                const latestSeason = await Tvshow.getLatestSeasonFromApi(tvshowId);
                // Get tvshow info, artwork and episodes
                const getTvshowData = await Promise.all([
                    Tvshow.getInfoFromApi(tvshowId),
                    Tvshow.getArtworkFromApi(tvshowId, 'poster'),
                    Tvshow.getEpisodesFromSeasonFromApi(tvshowId, latestSeason),
                ]);
                // Get tvshow imdb rating
                const imdbRating = await Tvshow.getImdbRating(getTvshowData[0].imdb);
                // Merge tvshow info and artwork
                const tvshowInfo = Object.assign(
                    {},
                    getTvshowData[0],
                    { images: [getTvshowData[0].images[0], getTvshowData[1]] },
                    { imdbRating },
                );
                // Merge episodes
                const [,, episodes] = getTvshowData;
                tvshowData = Object.assign(
                    {},
                    tvshowInfo,
                    { episodes },
                    { latestSeason },
                );
                // Add tvshow info to the db (in the background)
                Tvshow.addTvshowToDb(tvshowInfo).catch(e => console.log(e));
            } catch (e) {
                console.log(e);
                // TODO: this should break here because there's no info on the show
                // next(err) should probably work
            }
        }
        const userId = _.get(req, 'user', false);
        // Check if user is following the tvshow
        let isUserFollowingTvshow;
        if (!userId) {
            isUserFollowingTvshow = false;
        } else {
            try {
                isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
            } catch (e) {
                console.log(e);
                isUserFollowingTvshow = false;
            }
        }
        // Render tvshow view
        return res.render('tvshow', {
            name: tvshowData.name,
            banner: `https://www.thetvdb.com/banners/${tvshowData.images[0]}`,
            poster: `https://www.thetvdb.com/banners/${tvshowData.images[1]}`,
            overview: tvshowData.overview,
            premiered: tvshowData.premiered,
            network: tvshowData.network,
            status: tvshowData.status,
            airdate: tvshowData.airdate,
            genre: tvshowData.genre,
            imdbRating: tvshowData.imdbRating,
            season: tvshowData.latestSeason,
            episodes: tvshowData.episodes,
            isUserFollowingTvshow,
            isAuthenticated: !!userId,
        });
    },
};

module.exports = tvshowsController;
