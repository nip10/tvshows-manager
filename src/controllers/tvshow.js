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
     * Get tvshow information from the thetvdb api
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    async getTvshowDataFromApi(req, res, next) {
        if (res.locals.isTvshowOnDb && res.locals.tvshowData) {
            return next();
        }
        const { tvshowId } = req.params;
        try {
            const latestSeason = await Tvshow.getNumSeasonsFromApi(tvshowId);
            const tvshowData = await Promise.all([
                Tvshow.getInfoFromApi(tvshowId),
                Tvshow.getArtworkFromApi(tvshowId, 'poster'),
                Tvshow.getEpisodesFromSeasonFromApi(tvshowId, latestSeason),
            ]);
            const tvshowInfo = Object.assign(
                {},
                tvshowData[0],
                { images: [tvshowData[0].images[0], tvshowData[1]] },
            );
            const [,, episodes] = tvshowData;
            const tvshowDataNew = Object.assign(
                {},
                tvshowInfo,
                { episodes },
                { latestSeason },
            );
            // Add tvshow to the db in the background
            Tvshow.addTvshowToDb(tvshowInfo).catch(e => console.log(e));
            res.locals.tvshowData = tvshowDataNew;
            return next();
        } catch (e) {
            console.log(e);
            return next();
            // TODO: this should break here because there's no info on the show
        }
    },
    /**
     * Get tvshow information from the db
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    async getTvshowDataFromDb(req, res, next) {
        if (!res.locals.isTvshowOnDb) {
            return next();
        }
        const { tvshowId } = req.params;
        const latestSeason = await Tvshow.getLatestSeasonFromDb(tvshowId);
        const tvshowData = await Promise.all([
            Tvshow.getInfoFromDb(tvshowId),
            Tvshow.getEpisodesFromSeasonFromDb(tvshowId, latestSeason),
        ]);
        const tvshowDataObj = Object.assign(
            {},
            tvshowData[0],
            { episodes: tvshowData[1] },
            { latestSeason },
        );
        res.locals.tvshowData = tvshowDataObj;
        return next();
    },
    /**
     * Render tvshow view
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async renderTvshowView(req, res) {
        const { tvshowData } = res.locals;
        const userId = req.user;
        res.render('tvshow', {
            title: 'Tv-shows Manager',
            name: tvshowData.name,
            banner: `https://www.thetvdb.com/banners/${tvshowData.images[0]}`,
            poster: `https://www.thetvdb.com/banners/${tvshowData.images[1]}`,
            overview: tvshowData.overview,
            premiered: tvshowData.premiered,
            network: tvshowData.network,
            status: tvshowData.status,
            airdate: tvshowData.airdate,
            season: tvshowData.latestSeason,
            episodes: tvshowData.episodes,
            isUserFollowingTvshow: res.locals.isUserFollowingTvshow,
            isAuthenticated: !!userId,
        });
    },
    /**
     * Get episodes from the db
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async getEpisodesFromSeasonFromDb(req, res) {
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
     * Check if a tvshow is on the db
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    async isTvshowOnDb(req, res, next) {
        const { tvshowId } = req.params;
        try {
            const isTvshowOnDb = await Tvshow.isOnDb(tvshowId);
            res.locals.isTvshowOnDb = isTvshowOnDb;
            return next();
        } catch (e) {
            console.log(e);
            // if the db is unreachable, continue to the next middleware to fetch
            // the data from the api
            return next();
        }
    },
    /**
     * Check if a user is following a tvshow
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    async isUserFollowingTvshow(req, res, next) {
        const userId = _.get(req, 'user', false);
        if (!userId) {
            res.locals.isUserFollowingTvshow = false;
            return next();
        }
        const { tvshowId } = req.params;
        try {
            const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
            res.locals.isUserFollowingTvshow = isUserFollowingTvshow;
            return next();
        } catch (e) {
            res.locals.isUserFollowingTvshow = false;
            return next();
        }
    },
};

module.exports = tvshowsController;
