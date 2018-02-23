import _ from 'lodash';
import Tvshow from '../models/tvshow';
import User from '../models/user';
import { ERROR } from '../utils/constants';

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
      return res.status(400).json({ error: ERROR.TVSHOW.INVALID });
    }
    try {
      const data = await Tvshow.search(tvshowName);
      if (_.isNil(data)) return res.json({ error: ERROR.TVSHOW.NOT_FOUND });
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: ERROR.SERVER });
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
      return res.status(500).json({ error: ERROR.SERVER });
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
   * @returns {undefined}
   */
  async getData(req, res) {
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
        if (!latestSeason) throw new Error();
        const getTvshowData = await Promise.all([
          Tvshow.getInfoFromDb(tvshowId),
          Tvshow.getEpisodesFromSeasonFromDb(tvshowId, latestSeason),
        ]);
        tvshowData = Object.assign({}, getTvshowData[0], { episodes: getTvshowData[1] }, { latestSeason });
      } catch (e) {
        console.log(e);
        return res.status(500).render('error', {
          error: ERROR.SERVER,
        });
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
        tvshowData = Object.assign(
          {},
          getTvshowData[0],
          { images: [getTvshowData[0].images[0], getTvshowData[1]] },
          { imdbRating },
          { episodes: getTvshowData[2] },
          { latestSeason }
        );
        // Add tvshow info to the db (in the background)
        Tvshow.addTvshowToDb(
          _.pick(tvshowData, [
            'name',
            'overview',
            'status',
            'imdb',
            'imdbRating',
            'thetvdb',
            'genre',
            'premiered',
            'network',
            'airdate',
            'tvrating',
            'images',
          ])
        ).catch(e => console.log(e));
      } catch (e) {
        console.log(e);
        return res.status(500).render('error', {
          error: ERROR.SERVER,
        });
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
    // If the user is following the tvshow, check if he has watched episodes
    if (isUserFollowingTvshow) {
      const episodeIds = _.map(tvshowData.episodes, ep => ep.id);
      try {
        const watchedEpisodesIds = await User.getWatchedEpisodesById(episodeIds, userId);
        tvshowData.episodes = _.map(tvshowData.episodes, episode => ({
          id: episode.id,
          num: episode.num,
          name: episode.name,
          airdate: episode.airdate,
          watched: _.includes(watchedEpisodesIds, episode.id),
        }));
      } catch (e) {
        console.log(e);
      }
    }
    // Render tvshow view
    return res.render('tvshow', {
      name: tvshowData.name,
      id: tvshowId,
      banner: `https://www.thetvdb.com/banners/${tvshowData.images[0]}`,
      poster: `https://www.thetvdb.com/banners/${tvshowData.images[1]}`,
      overview: tvshowData.overview,
      premiered: tvshowData.premiered,
      network: tvshowData.network,
      status: tvshowData.status,
      airdate: tvshowData.airdate,
      genre: tvshowData.genre,
      imdb: `https://imdb.com/title/${tvshowData.imdb}`,
      imdbRating: tvshowData.imdbRating,
      season: tvshowData.latestSeason,
      episodes: tvshowData.episodes,
      isUserFollowingTvshow,
      isAuthenticated: !!userId,
    });
  },
};

module.exports = tvshowsController;
